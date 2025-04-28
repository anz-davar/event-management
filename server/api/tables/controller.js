const service = require("./service");

// Get all tables
const getTables = async (req, res) => {
  try {
    const tables = await service.getTables();
    return res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch tables" });
  }
};

// Get tables by hall ID
const getTablesByHallId = async (req, res) => {
  try {
    const { hallId } = req.params;
    if (!hallId) {
      return res.status(400).json({ success: false, error: "Hall ID is required" });
    }
    const tables = await service.getTablesByHallId(hallId);
    return res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Failed to fetch tables for hall" });
  }
};

// Add a new table
const addTable = async (req, res) => {
  try {
    const { HallID, MaxSeats, TableLocation } = req.body;
    if (!HallID || !MaxSeats) {
      return res.status(400).json({ success: false, error: "HallID and MaxSeats are required" });
    }
    const result = await service.addTable({ HallID, MaxSeats, TableLocation });
    if (result && result.insertId) {
      const createdTable = await service.getTableById(result.insertId);
      return res.status(201).json({ success: true, data: createdTable });
    }
    return res.status(500).json({ success: false, error: "Failed to add table" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to add table" });
  }
};

// Get a table by ID
const getTableById = async (req, res) => {
  try {
    const { TableID } = req.params;
    if (!TableID) {
      return res.status(400).json({ success: false, error: "TableID is required" });
    }
    const table = await service.getTableById(TableID);
    if (!table) {
      return res.status(404).json({ success: false, error: "Table not found" });
    }
    return res.status(200).json({ success: true, data: table });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch table" });
  }
};

// Update a table
const updateTable = async (req, res) => {
  try {
    const table = req.body;
    const { TableID } = req.params;
    if (!table || !TableID || !table.HallID || !table.MaxSeats) {
      return res.status(400).json({ success: false, error: "TableID, HallID, and MaxSeats are required" });
    }
    const result = await service.updateTable(TableID, table);
    if (!result) {
      return res.status(404).json({ success: false, error: "Table not found or update failed" });
    }
    const updatedTable = await service.getTableById(TableID);
    return res.status(200).json({ success: true, data: updatedTable });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to update table" });
  }
};

// Delete a table
const deleteTable = async (req, res) => {
  try {
    const { TableID } = req.params;
    if (!TableID) {
      return res.status(400).json({ success: false, error: "TableID is required" });
    }
    const result = await service.deleteTable(TableID);
    if (!result) {
      return res.status(404).json({ success: false, error: "Table not found or delete failed" });
    }
    return res.status(200).json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message || "Failed to delete table" });
  }
};

module.exports = {
  getTables,
  getTablesByHallId,
  addTable,
  getTableById,
  updateTable,
  deleteTable,
};