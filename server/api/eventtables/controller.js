const service = require('./service');

// Get all tables assigned to an event
const getEventTables = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ success: false, error: 'EventID required' });
    const tables = await service.getEventTables(eventId);
    return res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Assign a table to an event
const assignTableToEvent = async (req, res) => {
  try {
    const { EventID, TableID } = req.body;
    if (!EventID || !TableID) return res.status(400).json({ success: false, error: 'EventID and TableID required' });
    const result = await service.assignTableToEvent(EventID, TableID);
    if (result.error) return res.status(400).json({ success: false, error: result.error });
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Remove a table from an event
const removeTableFromEvent = async (req, res) => {
  try {
    const { EventID, TableID } = req.body;
    if (!EventID || !TableID) return res.status(400).json({ success: false, error: 'EventID and TableID required' });
    const result = await service.removeTableFromEvent(EventID, TableID);
    if (result.error) return res.status(400).json({ success: false, error: result.error });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getEventTables,
  assignTableToEvent,
  removeTableFromEvent,
};
