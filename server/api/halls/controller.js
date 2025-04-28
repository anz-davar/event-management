const service = require("./service");

// Get all halls
const getHalls = async (req, res) => {
  try {
    const halls = await service.getHalls();
    return res.json({ halls });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ halls: [], error: "An error occurred" });
  }
};



// Get hall name by HallID
const getHallNameById = async (req, res) => {
  try {
    const hallId = req.params.hallId;
    const hallName = await service.getHallById(hallId);
    res.status(200).json(hallName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create hall
const createHall = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { HallName, MaxCapacity, Location, EventType } = req.body;
    if (!HallName || !MaxCapacity || !Location || !EventType) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }
    const result = await service.createHall({ HallName, MaxCapacity, Location, EventType });
    if (result && result.insertId) {
      // Return the created hall object (fetch after insert if needed)
      const createdHall = await service.getHallById(result.insertId);
      return res.status(201).json({ success: true, data: createdHall });
    } else {
      return res.status(500).json({ success: false, error: "Failed to create hall" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to create hall" });
  }
};

// Update hall
const updateHall = async (req, res) => {
  try {
    // Optionally, restrict to admin:
    // if (req.user?.Role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });

    const { HallID, HallName, MaxCapacity, Location, EventType } = req.body;
    if (!HallID || !HallName || !MaxCapacity || !Location || !EventType) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }
    const result = await service.updateHall({ HallID, HallName, MaxCapacity, Location, EventType });
    if (result) {
      const updatedHall = await service.getHallById(HallID);
      return res.status(200).json({ success: true, data: updatedHall });
    } else {
      return res.status(404).json({ success: false, error: "Hall not found or not updated" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update hall" });
  }
};

// Delete hall
const deleteHall = async (req, res) => {
  try {
    const hallId = req.params.hallId;
    const result = await service.deleteHall(hallId);
    if (result) {
      return res.status(200).json({ success: true, data: result });
    } else {
      return res.status(500).json({ success: false, error: "Failed to delete hall" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete hall" });
  }
};


module.exports = {
  getHalls,
  getHallNameById,
  createHall,
  updateHall,
  deleteHall,
};
