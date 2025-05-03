const pool = require("../../db/connection");

// Check if event exists
const checkEventExists = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT 1 FROM events WHERE EventID = ?", [eventId]);
    return rows.length > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

// Get event details for notifications
const getEventDetails = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT e.EventID, e.EventName, e.EventDate, e.Location, e.MaxGuests, u.UserID, u.Username, u.Email 
       FROM events e 
       LEFT JOIN users u ON e.UserID = u.UserID 
       WHERE e.EventID = ?`, 
      [eventId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//get all guests
const getGuests = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM guests");
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

//add guest
const addGuest = async (guest) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO guests (EventID, FullName, ContactInfo, Preferences, Restrictions) VALUES (?, ?, ?, ?, ?)",
      [guest.EventID, guest.FullName, guest.ContactInfo, guest.Preferences, guest.Restrictions]
    );
    return result; // result.insertId
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//update guest
const updateGuest = async (guest) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "UPDATE guests SET EventID=?, FullName=?, ContactInfo=?, Preferences=?, Restrictions=? WHERE GuestID = ?",
      [guest.EventID, guest.FullName, guest.ContactInfo, guest.Preferences, guest.Restrictions, guest.GuestID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

//delete guest
const deleteGuest = async (guestId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "DELETE FROM guests WHERE GuestID = ?",
      [guestId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

// Get guests by eventId
const getGuestsByEventId = async (eventId) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM guests WHERE EventID = ?", [eventId]);
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

module.exports = {
  getGuests,
  getGuestsByEventId,
  addGuest,
  updateGuest,
  deleteGuest,
  checkEventExists,
  getEventDetails,
};

