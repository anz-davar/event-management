const service = require("./service");

// Add public guest (self-registration, no auth required)
const addPublicGuest = async (req, res) => {
  try {
    const { EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable } = req.body;

    if (!EventID || !FullName) {
      return res.status(400).json({ success: false, error: "EventID and FullName are required" });
    }

    // Verify the event exists before adding a guest
    const eventExists = await service.checkEventExists(EventID);
    if (!eventExists) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // Get event details to include in notification
    const eventDetails = await service.getEventDetails(EventID);

    const result = await service.addGuest({ EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable });

    if (result && result.insertId) {
      // Get the socket.io instance
      const io = req.app.get('io');

      // Emit a notification to the event room
      if (io) {
        io.to(`event-${EventID}`).emit('guestRegistered', {
          guest: {
            GuestID: result.insertId,
            FullName,
            ContactInfo,
            Preferences,
            Restrictions,
            NeedsAccessibleTable
          },
          event: eventDetails
        });

        console.log(`Notification sent to event-${EventID} room for new guest: ${FullName}`);
      }

      return res.status(201).json({
        success: true,
        data: { GuestID: result.insertId, EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable }
      });
    } else {
      return res.status(500).json({ success: false, error: "Failed to register" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to register" });
  }
};

// Handle family registration (multiple guests with shared contact info)
const addPublicFamilyGuests = async (req, res) => {
  try {
    // req.body should be an array of guest objects
    const familyMembers = req.body;

    if (!Array.isArray(familyMembers) || familyMembers.length === 0) {
      return res.status(400).json({ success: false, error: "Family members data is required" });
    }

    // Validate all family members have required fields
    const invalidMembers = familyMembers.filter(member => !member.EventID || !member.FullName || !member.ContactInfo);
    if (invalidMembers.length > 0) {
      return res.status(400).json({ success: false, error: "All family members must have EventID, FullName, and ContactInfo" });
    }

    // Verify the event exists
    const eventExists = await service.checkEventExists(familyMembers[0].EventID);
    if (!eventExists) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // Get event details for notification
    const eventDetails = await service.getEventDetails(familyMembers[0].EventID);

    // Add all family members as a transaction
    const results = await service.addFamilyGuests(familyMembers);

    if (results && results.success) {
      // Get the socket.io instance
      const io = req.app.get('io');

      // Emit a notification to the event room
      if (io) {
        io.to(`event-${familyMembers[0].EventID}`).emit('familyRegistered', {
          family: results.guests,
          count: results.guests.length,
          event: eventDetails
        });

        console.log(`Notification sent to event-${familyMembers[0].EventID} room for new family registration with ${results.guests.length} members`);
      }

      return res.status(201).json({
        success: true,
        data: {
          guests: results.guests,
          count: results.guests.length
        }
      });
    } else {
      return res.status(500).json({ success: false, error: "Failed to register family" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to register family" });
  }
};

// Get all guests or guests by eventId
const getGuests = async (req, res) => {
  try {
    const { eventId } = req.query;
    let guests;
    if (eventId) {
      guests = await service.getGuestsByEventId(eventId);
    } else {
      guests = await service.getGuests();
    }
    return res.status(200).json({ success: true, data: guests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch guests" });
  }
};


// Add guest
const addGuest = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable } = req.body;
    if (!EventID || !FullName) {
      return res.status(400).json({ success: false, error: "EventID and FullName are required" });
    }
    const result = await service.addGuest({ EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable });
    if (result && result.insertId) {
      return res.status(201).json({
        success: true,
        data: {
          GuestID: result.insertId,
          EventID,
          FullName,
          ContactInfo,
          Preferences,
          Restrictions,
          NeedsAccessibleTable
        }
      });
    } else {
      return res.status(500).json({ success: false, error: "Failed to add guest" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to add guest" });
  }
};

// Update guest
const updateGuest = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { GuestID, EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable } = req.body;
    if (!GuestID || !EventID || !FullName) {
      return res.status(400).json({ success: false, error: "GuestID, EventID, and FullName are required" });
    }
    const result = await service.updateGuest({ GuestID, EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable });
    if (result) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ success: false, error: "Guest not found or not updated" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update guest" });
  }
};

// Delete guest
const deleteGuest = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { GuestID } = req.params;
    if (!GuestID) {
      return res.status(400).json({ success: false, error: "GuestID is required" });
    }
    const result = await service.deleteGuest(GuestID);
    if (result) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ success: false, error: "Guest not found or not deleted" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete guest" });
  }
};

// Get table assignments by contact info
const getTablesByContactInfo = async (req, res) => {
  try {
    const { eventId, contactInfo } = req.query;

    if (!eventId || !contactInfo) {
      return res.status(400).json({ success: false, error: "Event ID and contact info are required" });
    }

    const tableAssignments = await service.getTablesByContactInfo(eventId, contactInfo);

    return res.status(200).json({
      success: true,
      data: tableAssignments
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to retrieve table assignments" });
  }
};

module.exports = {
  getGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  addPublicGuest,
  addPublicFamilyGuests,
  getTablesByContactInfo,
};
