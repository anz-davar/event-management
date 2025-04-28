const pool = require("../../db/connection");

//get all events
const getEvents = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM events");
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

//add event
const addEvent = async (event) => {
  let conn;
  console.log(event);
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO events (UserID, EventName, EventDate, Location, MaxGuests, HallID) VALUES (?, ?, ?, ?, ?, ?)",
      [event.UserID, event.EventName, event.EventDate, event.Location, event.MaxGuests, event.HallID]
    );
    return result; // result.insertId
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//update event
const updateEvent = async (event) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // Ensure EventDate is in the correct DATE format (YYYY-MM-DD)
    const formattedEventDate = new Date(event.EventDate).toISOString().split("T")[0];
    const [result] = await conn.query(
      "UPDATE events SET UserID = ?, EventName = ?, EventDate = ?, Location = ?, MaxGuests = ? WHERE EventID = ?",
      [event.UserID, event.EventName, formattedEventDate, event.Location, event.MaxGuests, event.EventID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
};

//get event by id with user info
const getEventById = async (EventID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT events.*, users.Username, users.Email
       FROM events
       JOIN users ON events.UserID = users.UserID
       WHERE events.EventID = ?`,
      [EventID]
    );
    return rows[0];
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

//delete event
const deleteEvent = async (EventID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "DELETE FROM events WHERE EventID = ?",
      [EventID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

// Get events for a specific user
const getEventsByUserId = async (userId) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM events WHERE UserID = ?", [userId]);
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

module.exports = {
  getEvents,
  getEventsByUserId,
  addEvent,
  updateEvent,
  getEventById,
  deleteEvent
};

