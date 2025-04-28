const pool = require("../../db/connection");

// get all Halls
const getHalls = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM halls");
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Get hall name by HallID
const getHallById = async (hallId) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM halls WHERE HallID = ?", [
      hallId,
    ]);
    conn.release();
    return rows[0];
  } catch (error) {
    console.log(error);
    return null;
  }
};

// create hall
const createHall = async (hall) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO halls (HallName, MaxCapacity, Location, EventType) VALUES (?, ?, ?, ?)",
      [hall.HallName, hall.MaxCapacity, hall.Location, hall.EventType]
    );
    return result; // result.insertId
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//update hall
const updateHall = async (hall) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "UPDATE halls SET HallName = ?, MaxCapacity = ?, Location = ?, EventType = ? WHERE HallID = ?",
      [hall.HallName, hall.MaxCapacity, hall.Location, hall.EventType, hall.HallID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

//delete hall
const deleteHall = async (hallId) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("DELETE FROM halls WHERE HallID = ?", [
      hallId,
    ]);
    conn.release();
    return rows.affectedRows > 0; // Return true if the deletion was successful
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
};
