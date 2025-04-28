const pool = require("../../db/connection");

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
};

