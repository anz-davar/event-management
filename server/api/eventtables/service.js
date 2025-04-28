const pool = require('../../db/connection');

// Get all tables assigned to an event
const getEventTables = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT et.EventTableID, et.EventID, et.TableID, t.MaxSeats, t.TableLocation
       FROM event_tables et
       JOIN tables t ON et.TableID = t.TableID
       WHERE et.EventID = ?`,
      [eventId]
    );
    return rows;
  } catch (error) {
    console.error(error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// Assign a table to an event
const assignTableToEvent = async (EventID, TableID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // Prevent duplicates
    const [existing] = await conn.query('SELECT * FROM event_tables WHERE EventID = ? AND TableID = ?', [EventID, TableID]);
    if (existing.length > 0) return { error: 'Table already assigned to event' };
    const [result] = await conn.query('INSERT INTO event_tables (EventID, TableID) VALUES (?, ?)', [EventID, TableID]);
    return result;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

// Remove a table from an event
const removeTableFromEvent = async (EventID, TableID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query('DELETE FROM event_tables WHERE EventID = ? AND TableID = ?', [EventID, TableID]);
    return result;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  getEventTables,
  assignTableToEvent,
  removeTableFromEvent,
};
