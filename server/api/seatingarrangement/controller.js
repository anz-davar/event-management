const service = require("./service");

//all seating arrangements
const getSeatingArrangements = async (req, res) => {
  try {
    const seatingArrangements = await service.getSeatingArrangements();
    return res.status(200).json({ success: true, data: seatingArrangements });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch seating arrangements" });
  }
};

// get seating arrangement by id
const getSeatingArrangementById = async (req, res) => {
  try {
    const { SeatingID } = req.params;
    if (!SeatingID) {
      return res.status(400).json({ success: false, error: "SeatingID is required" });
    }
    const seatingArrangement = await service.getSeatingArrangementById(SeatingID);
    if (!seatingArrangement) {
      return res.status(404).json({ success: false, error: "Seating arrangement not found" });
    }
    return res.status(200).json({ success: true, data: seatingArrangement });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch seating arrangement" });
  }
};

//update seating arrangement
const updateSeatingArrangement = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const seatingArrangement = req.body;
    const { SeatingID } = req.params;
    if (!seatingArrangement || !SeatingID) {
      return res.status(400).json({ success: false, error: "SeatingID is required" });
    }
    const result = await service.updateSeatingArrangement(SeatingID, seatingArrangement);
    if (!result || result.error || result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: result?.error || "Seating arrangement not found or update failed" });
    }
    const updated = await service.getSeatingArrangementById(SeatingID);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update seating arrangement" });
  }
};


// create a seating arrangement
const createSeatingArrangement = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { GuestID, TableID, SeatNumber, EventID } = req.body;
    if (!GuestID || !TableID || !SeatNumber || !EventID) {
      return res.status(400).json({ success: false, error: "GuestID, TableID, SeatNumber, and EventID are required" });
    }
    // Look up EventTableID
    let conn;
    try {
      conn = await require('../../db/connection').getConnection();
      const [rows] = await conn.query(
        'SELECT EventTableID FROM event_tables WHERE TableID = ? AND EventID = ?',
        [TableID, EventID]
      );
      if (!rows.length) {
        return res.status(400).json({ success: false, error: "No EventTableID found for this Table and Event" });
      }
      const EventTableID = rows[0].EventTableID;
      const result = await service.createSeatingArrangement({ GuestID, EventTableID, SeatNumber });
      if (result && result.insertId) {
        const created = await service.getSeatingArrangementById(result.insertId);
        return res.status(201).json({ success: true, data: created });
      }
      return res.status(400).json({ success: false, error: result?.error || "Failed to create seating arrangement" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message || "Failed to create seating arrangement" });
    } finally {
      if (conn) conn.release();
    }
    if (result && result.insertId) {
      const created = await service.getSeatingArrangementById(result.insertId);
      return res.status(201).json({ success: true, data: created });
    }
    return res.status(400).json({ success: false, error: result?.error || "Failed to create seating arrangement" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create seating arrangement" });
  }
};

// remove seating arrangement
const removeSeatingArrangement = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { SeatingArrangementID } = req.params;
    if (!SeatingArrangementID) {
      return res.status(400).json({ success: false, error: "SeatingArrangementID is required" });
    }
    const result = await service.removeSeatingArrangement(SeatingArrangementID);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Seating arrangement not found or delete failed" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete seating arrangement" });
  }
};

// Auto-arrange seats using Tabu Search
const optimizeSeatingArrangement = async (req, res) => {
  const { eventId } = req.params;
  try {
    if (!eventId) return res.status(400).json({ success: false, error: 'eventId is required' });
    // Call the service to run Tabu Search and update seating
    const result = await service.optimizeSeatingArrangement(eventId);
    if (result && result.success) {
      // Return the new seating arrangement
      const seatingArrangements = await service.getSeatingArrangements();
      return res.status(200).json({ success: true, data: seatingArrangements });
    } else {
      return res.status(500).json({ success: false, error: result?.error || 'Failed to optimize seating' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to optimize seating' });
  }
};

module.exports = {
  getSeatingArrangements,
  optimizeSeatingArrangement,
  updateSeatingArrangement,
  createSeatingArrangement,
  getSeatingArrangementById,
  removeSeatingArrangement,
};
