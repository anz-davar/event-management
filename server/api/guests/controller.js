const service = require("./service");

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

    const { EventID, FullName, ContactInfo, Preferences, Restrictions } = req.body;
    if (!EventID || !FullName) {
      return res.status(400).json({ success: false, error: "EventID and FullName are required" });
    }
    const result = await service.addGuest({ EventID, FullName, ContactInfo, Preferences, Restrictions });
    if (result && result.insertId) {
      return res.status(201).json({ success: true, data: { GuestID: result.insertId, EventID, FullName, ContactInfo, Preferences, Restrictions } });
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

    const { GuestID, EventID, FullName, ContactInfo, Preferences, Restrictions } = req.body;
    if (!GuestID || !EventID || !FullName) {
      return res.status(400).json({ success: false, error: "GuestID, EventID, and FullName are required" });
    }
    const result = await service.updateGuest({ GuestID, EventID, FullName, ContactInfo, Preferences, Restrictions });
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

module.exports = {
  getGuests,
  addGuest,
  updateGuest,
  deleteGuest,
};
