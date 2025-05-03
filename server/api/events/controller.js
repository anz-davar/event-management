const service = require("./service");

// Get all events or only user's events
const getEvents = async (req, res) => {
  try {
    let events;
    if (req.user && req.user.Role === 'admin') {
      events = await service.getEvents();
    } else {
      events = await service.getEventsByUserId(req.user.UserID);
    }
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
};

// Add a new event
const addEvent = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { UserID, EventName, EventDate, Location, MaxGuests, HallID } = req.body;
    if (!UserID || !EventName || !EventDate) {
      return res.status(400).json({ success: false, error: "UserID, EventName, and EventDate are required" });
    }
    const result = await service.addEvent({ UserID, EventName, EventDate, Location, MaxGuests, HallID });
    if (result && result.insertId) {
      const createdEvent = await service.getEventById(result.insertId);
      return res.status(201).json({ success: true, data: createdEvent });
    }
    return res.status(500).json({ success: false, error: "Failed to add event" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to add event" });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const event = req.body;
    if (!event || !event.EventID || !event.UserID || !event.EventName || !event.EventDate) {
      return res.status(400).json({ success: false, error: "EventID, UserID, EventName, and EventDate are required" });
    }
    const result = await service.updateEvent(event);
    if (!result) {
      return res.status(404).json({ success: false, error: "Event not found or update failed" });
    }
    const updatedEvent = await service.getEventById(event.EventID);
    return res.status(200).json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update event" });
  }
};

// Get an event by ID for public access (no auth required)
const getPublicEventById = async (req, res) => {
  try {
    const { EventID } = req.params;
    if (!EventID) {
      return res.status(400).json({ success: false, error: "EventID is required" });
    }
    const event = await service.getEventById(EventID);
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    
    // Return only necessary information for public display
    // (omit sensitive data if needed)
    const publicEventData = {
      EventID: event.EventID,
      EventName: event.EventName,
      EventDate: event.EventDate,
      location: event.Location,
      MaxGuests: event.MaxGuests
    };
    
    return res.status(200).json({ success: true, data: publicEventData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch event" });
  }
};

// Get an event by ID
const getEventById = async (req, res) => {
  try {
    const { EventID } = req.params;
    if (!EventID) {
      return res.status(400).json({ success: false, error: "EventID is required" });
    }
    const event = await service.getEventById(EventID);
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch event" });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const { EventID } = req.params;
    if (!EventID) {
      return res.status(400).json({ success: false, error: "EventID is required" });
    }
    const result = await service.deleteEvent(EventID);
    if (!result) {
      return res.status(404).json({ success: false, error: "Event not found or delete failed" });
    }
    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete event" });
  }
};

module.exports = {
  getEvents,
  addEvent,
  updateEvent,
  getEventById,
  deleteEvent,
  getPublicEventById,
};
