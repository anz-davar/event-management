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
const addGuest = async (guestData) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable } = guestData;
    const [result] = await conn.query(
      'INSERT INTO guests (EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable) VALUES (?, ?, ?, ?, ?, ?)',
      [EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable || 0]
    );
    return result;
  } catch (error) {
    console.error('Error adding guest:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
};

// Add multiple family members in a single transaction
const addFamilyGuests = async (familyMembers) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    
    const insertedGuests = [];
    
    // Insert each family member
    for (const member of familyMembers) {
      const { EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable } = member;
      const [result] = await conn.query(
        'INSERT INTO guests (EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable) VALUES (?, ?, ?, ?, ?, ?)',
        [EventID, FullName, ContactInfo, Preferences, Restrictions, NeedsAccessibleTable || 0]
      );
      
      insertedGuests.push({
        GuestID: result.insertId,
        EventID,
        FullName,
        ContactInfo,
        Preferences,
        Restrictions,
        NeedsAccessibleTable: NeedsAccessibleTable || 0
      });
    }
    
    await conn.commit();
    return { success: true, guests: insertedGuests };
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('Error adding family guests:', error);
    throw error;
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
      "UPDATE guests SET EventID=?, FullName=?, ContactInfo=?, Preferences=?, Restrictions=?, NeedsAccessibleTable=? WHERE GuestID = ?",
      [guest.EventID, guest.FullName, guest.ContactInfo, guest.Preferences, guest.Restrictions, guest.NeedsAccessibleTable || 0, guest.GuestID]
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
  addFamilyGuests,
  updateGuest,
  deleteGuest,
  checkEventExists,
  getEventDetails,
};

