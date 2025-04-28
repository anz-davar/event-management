const pool = require("../../db/connection");

// Get all seating arrangements
const getSeatingArrangements = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT sa.SeatingID, sa.GuestID, sa.SeatNumber, et.TableID, et.EventID
      FROM seatingarrangement sa
      JOIN event_tables et ON sa.EventTableID = et.EventTableID
    `);
    return rows;
  } catch (error) {
    console.error("getSeatingArrangements error:", error.message);
    return [];
  } finally {
    if (conn) conn.release();
  }
};

// Get seating arrangement by ID
const getSeatingArrangementById = async (SeatingID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(
      "SELECT * FROM seatingarrangement WHERE SeatingID = ?",
      [SeatingID]
    );
    return rows?.[0] || null;
  } catch (error) {
    console.error("getSeatingArrangementById error:", error.message);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Create a seating arrangement with validation
const createSeatingArrangement = async (seatingArrangement) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [result] = await conn.query(
      `
      INSERT INTO seatingarrangement (GuestID, EventTableID, SeatNumber)
      SELECT ?, ?, ?
      FROM event_tables et
      JOIN tables t ON et.TableID = t.TableID
      WHERE et.EventTableID = ?
        AND (
          SELECT COUNT(*) FROM seatingarrangement WHERE EventTableID = ?
        ) < t.MaxSeats
        AND NOT EXISTS (
          SELECT 1 FROM seatingarrangement 
          WHERE EventTableID = ? AND SeatNumber = ?
        )
      `,
      [
        seatingArrangement.GuestID,
        seatingArrangement.EventTableID,
        seatingArrangement.SeatNumber,
        seatingArrangement.EventTableID,
        seatingArrangement.EventTableID,
        seatingArrangement.EventTableID,
        seatingArrangement.SeatNumber,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Table is full or seat is already taken");
    }

    return result;
  } catch (error) {
    console.error("createSeatingArrangement error:", error.message);
    return { error: error.message };
  } finally {
    if (conn) conn.release();
  }
};

// Update a seating arrangement with seat check
const updateSeatingArrangement = async (SeatingID, seatingArrangement) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `UPDATE seatingarrangement 
       SET GuestID = ?, TableID = ?, SeatNumber = ? 
       WHERE SeatingID = ?`,
      [
        seatingArrangement.GuestID,
        seatingArrangement.TableID,
        seatingArrangement.SeatNumber,
        SeatingID
      ]
    );
    conn.release();
    return rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};


// Remove seating arrangement
const removeSeatingArrangement = async (SeatingID) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [result] = await conn.query(
      "DELETE FROM seatingarrangement WHERE SeatingID = ?",
      [SeatingID]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("removeSeatingArrangement error:", error.message);
    return null;
  } finally {
    if (conn) conn.release();
  }
};

// Auto-arrange seats using simple Tabu Search
// Preferences/Restrictions are comma-separated guest IDs (for now)
// Score: +1 for each preference satisfied (guest sits at same table), -2 for each restriction violated (guest sits at same table)
// Tabu list: fixed-length array of swaps
// Iterations: 100 or until no improvement
const optimizeSeatingArrangement = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1. Fetch all guests for the event
    const [guests] = await conn.query('SELECT * FROM guests WHERE EventID = ?', [eventId]);
    // 2. Fetch all event tables for the event (with seat counts)
    const [eventTables] = await conn.query(`
      SELECT et.EventTableID, et.TableID, t.MaxSeats
      FROM event_tables et
      JOIN tables t ON et.TableID = t.TableID
      WHERE et.EventID = ?
    `, [eventId]);
    if (!guests.length || !eventTables.length) return { success: false, error: 'No guests or tables for this event' };
    // 3. Remove all existing seating for this event
    await conn.query(`DELETE sa FROM seatingarrangement sa JOIN event_tables et ON sa.EventTableID = et.EventTableID WHERE et.EventID = ?`, [eventId]);

    // --- Tabu Search Setup ---
    // Flatten seats: [{EventTableID, TableID, SeatNumber} ...]
    const seats = [];
    eventTables.forEach(table => {
      for (let i = 1; i <= table.MaxSeats; i++) {
        seats.push({ EventTableID: table.EventTableID, TableID: table.TableID, SeatNumber: i });
      }
    });
    if (guests.length > seats.length) return { success: false, error: 'Not enough seats for all guests' };

    // Initial solution: group guests by Preferences (group name) to the same table if possible
    // 1. Find all unique group names from Preferences
    const allGroups = Array.from(new Set(guests.map(g => (g.Preferences || '').split(',')).flat().map(s => s.trim()).filter(Boolean)));
    let assignment = [];
    let seatIdx = 0;
    // Assign each group to a table
    allGroups.forEach((group, groupIdx) => {
      // Find all guests in this group
      const groupGuests = guests.filter(g => (g.Preferences || '').split(',').map(s => s.trim()).includes(group));
      const table = eventTables[groupIdx % eventTables.length];
      groupGuests.forEach(g => {
        // Find next available seat at this table
        const takenSeats = assignment.filter(a => a.seat.EventTableID === table.EventTableID).map(a => a.seat.SeatNumber);
        const seat = seats.find(s => s.EventTableID === table.EventTableID && !takenSeats.includes(s.SeatNumber));
        assignment.push({ guest: g, seat });
      });
    });
    // Assign any remaining guests (with no group) round-robin
    const assignedIDs = assignment.map(a => a.guest.GuestID);
    const unassignedGuests = guests.filter(g => !assignedIDs.includes(g.GuestID));
    for (let idx = 0; idx < unassignedGuests.length; idx++) {
      const g = unassignedGuests[idx];
      const tableIdx = idx % eventTables.length;
      const table = eventTables[tableIdx];
      const takenSeats = assignment.filter(a => a.seat.EventTableID === table.EventTableID).map(a => a.seat.SeatNumber);
      const seat = seats.find(s => s.EventTableID === table.EventTableID && !takenSeats.includes(s.SeatNumber));
      assignment.push({ guest: g, seat });
    }
    let bestAssignment = assignment.slice();
    let bestScore = scoreAssignment(assignment);
    let tabuList = [];
    const TABU_LENGTH = 10;
    const ITERATIONS = 100;
    let noImprove = 0;

    function parseCSV(str) {
      if (!str) return [];
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Score: +1 for each guest at table that matches a group-keyword in Preferences, -2 for each that matches a group-keyword in Restrictions
    // MASSIVE BONUS/PENALTY: +1000 if all group members at same table, -1000 if split
    // Preferences/Restrictions are now group names (e.g. 'bride', 'groom', 'kosher', 'milk')
    function scoreAssignment(assign) {
      let score = 0;
      // --- Strong group logic ---
      // Find all unique group names
      const allGroups = Array.from(new Set(assign.map(a => (a.guest.Preferences || '').split(',')).flat().map(s => s.trim()).filter(Boolean)));
      for (const group of allGroups) {
        const groupMembers = assign.filter(a => (a.guest.Preferences || '').split(',').map(s => s.trim()).includes(group));
        const tables = Array.from(new Set(groupMembers.map(a => a.seat.TableID)));
        if (groupMembers.length > 1) {
          if (tables.length === 1) {
            // All group members at the same table
            score += 1000;
          } else {
            // Group is split
            score -= 1000;
          }
        }
      }
      // --- Original scoring ---
      for (const a of assign) {
        const guest = a.guest;
        const tableID = a.seat.TableID;
        const sameTable = assign.filter(x => x.seat.TableID === tableID && x.guest.GuestID !== guest.GuestID);
        // Preferences (group names)
        const prefs = parseCSV(guest.Preferences);
        for (const pref of prefs) {
          if (!pref) continue;
          for (const other of sameTable) {
            if (other.guest.Preferences && other.guest.Preferences.split(',').map(s => s.trim()).includes(pref)) {
              score += 1;
            }
            // Also: if other.guest matches pref as a group label (e.g., their Preferences or Restrictions contains the label)
            if (other.guest.Preferences && other.guest.Preferences.split(',').map(s => s.trim()).includes(pref)) {
              score += 1;
            }
            if (other.guest.Restrictions && other.guest.Restrictions.split(',').map(s => s.trim()).includes(pref)) {
              score += 1;
            }
            // Or, if guest's Preferences matches other's Preferences
            if (other.guest.Preferences && prefs.includes(other.guest.Preferences)) {
              score += 1;
            }
          }
        }
        // Restrictions (group names)
        const restrictions = parseCSV(guest.Restrictions);
        for (const rest of restrictions) {
          if (!rest) continue;
          for (const other of sameTable) {
            if (other.guest.Preferences && other.guest.Preferences.split(',').map(s => s.trim()).includes(rest)) {
              score -= 2;
            }
            if (other.guest.Restrictions && other.guest.Restrictions.split(',').map(s => s.trim()).includes(rest)) {
              score -= 2;
            }
            if (other.guest.Restrictions && restrictions.includes(other.guest.Restrictions)) {
              score -= 2;
            }
          }
        }
      }
      return score;
    }
    // Tabu Search main loop
    for (let iter = 0; iter < ITERATIONS && noImprove < 15; iter++) {
      let bestNeighbor = null;
      let bestNeighborScore = -Infinity;
      let swapIdxA = -1, swapIdxB = -1;
      // Try all pairs (could be optimized)
      for (let i = 0; i < assignment.length; i++) {
        for (let j = i + 1; j < assignment.length; j++) {
          // Tabu check
          if (tabuList.find(t => (t[0] === i && t[1] === j) || (t[0] === j && t[1] === i))) continue;
          // Swap guests
          const neighbor = assignment.slice();
          [neighbor[i].guest, neighbor[j].guest] = [neighbor[j].guest, neighbor[i].guest];
          const s = scoreAssignment(neighbor);
          if (s > bestNeighborScore) {
            bestNeighbor = neighbor;
            bestNeighborScore = s;
            swapIdxA = i; swapIdxB = j;
          }
        }
      }
      if (bestNeighbor && bestNeighborScore > bestScore) {
        assignment = bestNeighbor;
        bestScore = bestNeighborScore;
        bestAssignment = assignment.slice();
        noImprove = 0;
      } else {
        noImprove++;
      }
      if (swapIdxA !== -1 && swapIdxB !== -1) {
        tabuList.push([swapIdxA, swapIdxB]);
        if (tabuList.length > TABU_LENGTH) tabuList.shift();
      }
    }
    // --- End Tabu Search ---
    // Write bestAssignment to DB
    for (const a of bestAssignment) {
      await conn.query('INSERT INTO seatingarrangement (GuestID, EventTableID, SeatNumber) VALUES (?, ?, ?)', [a.guest.GuestID, a.seat.EventTableID, a.seat.SeatNumber]);
    }
    return { success: true };
  } catch (error) {
    console.error('optimizeSeatingArrangement error:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (conn) conn.release();
  }
};


module.exports = {
  getSeatingArrangements,
  optimizeSeatingArrangement,
  getSeatingArrangementById,
  createSeatingArrangement,
  updateSeatingArrangement,
  removeSeatingArrangement,
};
