const pool = require("../../db/connection");

// Get all tables
const getTables = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM tables");
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Get tables by hall ID
const getTablesByHallId = async (hallId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM tables WHERE HallID = ?", [hallId]);
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// Add table
const addTable = async (table) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO tables (TableName, MaxSeats, IsAccessible) VALUES (?, ?, ?)",
      [table.TableName, table.MaxSeats, table.IsAccessible || 0]
    );
    return { success: true, insertId: result.insertId };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

// Get table by id
const getTableById = async (TableID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM tables WHERE TableID = ?", [TableID]);
    return rows[0];
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Update table
const updateTable = async (tableID, table) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "UPDATE tables SET HallID = ?, MaxSeats = ?, TableLocation = ?, IsAccessible = ? WHERE TableID = ?",
      [table.HallID, table.MaxSeats, table.TableLocation, table.IsAccessible || 0, tableID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

// Delete table

// Delete table
const deleteTable = async (TableID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query("DELETE FROM tables WHERE TableID = ?", [TableID]);
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    throw error; // Propagate error to controller
  } finally {
    if (conn) conn.release();
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
