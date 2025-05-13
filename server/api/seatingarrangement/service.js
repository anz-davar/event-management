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


const optimizeSeatingArrangement1 = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1. Fetch all guests for the event
    const [guests] = await conn.query('SELECT * FROM guests WHERE EventID = ?', [eventId]);
    // 2. Fetch all event tables for the event (with seat counts)
    const [eventTables] = await conn.query(`
      SELECT et.EventTableID, et.TableID, t.MaxSeats, t.TableLocation
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
        seats.push({ EventTableID: table.EventTableID, TableID: table.TableID, SeatNumber: i, TableLocation: table.TableLocation });
      }
    });
    if (guests.length > seats.length) return { success: false, error: 'Not enough seats for all guests' };

    // Initial solution: First handle guests with accessibility needs, then group family members, then handle preference groups

    // 1. Group guests by ContactInfo (family members)
    const contactGroups = {};
    guests.forEach(guest => {
      if (guest.ContactInfo) {
        if (!contactGroups[guest.ContactInfo]) {
          contactGroups[guest.ContactInfo] = [];
        }
        contactGroups[guest.ContactInfo].push(guest);
      }
    });

    // Sort contact groups by size (largest families first)
    const sortedFamilies = Object.values(contactGroups)
        .filter(family => family.length > 1) // Only consider actual families (more than 1 member)
        .sort((a, b) => b.length - a.length);

    // 2. Assign each family to a table
    let assignment = [];
    let tableAssignments = {}; // Track how many seats are used at each table

    // Initialize table assignments
    eventTables.forEach(table => {
      tableAssignments[table.EventTableID] = {
        table: table,
        seatsUsed: 0,
        maxSeats: table.MaxSeats,
        isAccessible: table.IsAccessible === 1, // Convert to boolean
        tableLocation: table.TableLocation // Add TableLocation to tracking
      };
    });

    // First, identify accessible tables
    const accessibleTables = Object.values(tableAssignments).filter(t => t.isAccessible);
    const regularTables = Object.values(tableAssignments).filter(t => !t.isAccessible);

    // Group tables by location
    const tablesByLocation = {};
    Object.values(tableAssignments).forEach(tableEntry => {
      if (tableEntry.tableLocation) {
        if (!tablesByLocation[tableEntry.tableLocation]) {
          tablesByLocation[tableEntry.tableLocation] = [];
        }
        tablesByLocation[tableEntry.tableLocation].push(tableEntry);
      }
    });

    // Identify guests who need accessible tables
    const guestsNeedingAccessibility = guests.filter(g => g.NeedsAccessibleTable === 1);

    // STEP 1: First, handle guests who need accessible tables
    // Check if any family has members with accessibility needs
    const familiesWithAccessibilityNeeds = sortedFamilies.filter(family =>
        family.some(member => member.NeedsAccessibleTable === 1)
    );

    // Process families with accessibility needs first
    familiesWithAccessibilityNeeds.forEach(family => {
      // Check if family members have location preferences
      const locationPreference = family.find(member => member.Restriction && !member.Restriction.includes(','))?.Restriction;

      // Try to find an accessible table with matching location if possible
      let accessibleTableEntry = null;
      if (locationPreference && tablesByLocation[locationPreference]) {
        accessibleTableEntry = tablesByLocation[locationPreference]
            .filter(t => t.isAccessible)
            .find(t => (t.maxSeats - t.seatsUsed) >= family.length);
      }

      // If no matching location or not enough seats, fall back to any accessible table
      if (!accessibleTableEntry) {
        accessibleTableEntry = accessibleTables.find(t =>
            (t.maxSeats - t.seatsUsed) >= family.length
        );
      }

      if (accessibleTableEntry) {
        // Assign all family members to this accessible table
        family.forEach(guest => {
          const seatNumber = accessibleTableEntry.seatsUsed + 1;
          const seat = {
            EventTableID: accessibleTableEntry.table.EventTableID,
            TableID: accessibleTableEntry.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: accessibleTableEntry.tableLocation
          };
          assignment.push({ guest, seat });
          accessibleTableEntry.seatsUsed++;
        });

        // Remove this family from the regular families list to avoid double assignment
        const index = sortedFamilies.findIndex(f => f[0].ContactInfo === family[0].ContactInfo);
        if (index !== -1) {
          sortedFamilies.splice(index, 1);
        }
      } else {
        // If no accessible table has enough space for the whole family
        // We need to at least ensure the members with accessibility needs get accessible seats
        const membersNeedingAccessibility = family.filter(member => member.NeedsAccessibleTable === 1);
        const otherMembers = family.filter(member => member.NeedsAccessibleTable !== 1);

        // Try to seat those with accessibility needs at accessible tables
        membersNeedingAccessibility.forEach(guest => {
          // Try to find accessible table with location preference
          let accessibleTable = null;
          if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
            accessibleTable = tablesByLocation[guest.Restriction]
                .filter(t => t.isAccessible && t.seatsUsed < t.maxSeats)[0];
          }

          // If no matching location, use any accessible table
          if (!accessibleTable) {
            accessibleTable = accessibleTables.find(t => t.seatsUsed < t.maxSeats);
          }

          if (accessibleTable) {
            const seatNumber = accessibleTable.seatsUsed + 1;
            const seat = {
              EventTableID: accessibleTable.table.EventTableID,
              TableID: accessibleTable.table.TableID,
              SeatNumber: seatNumber,
              TableLocation: accessibleTable.tableLocation
            };
            assignment.push({ guest, seat });
            accessibleTable.seatsUsed++;
          }
        });

        // Try to seat other family members at the same tables if possible
        otherMembers.forEach(guest => {
          // First try to seat at the same tables as family members with accessibility needs
          const assignedAccessibleTables = assignment
              .filter(a => membersNeedingAccessibility.some(m => m.GuestID === a.guest.GuestID))
              .map(a => a.seat.EventTableID);

          let seated = false;

          // Try to seat at the same accessible table as other family members if possible
          for (const tableId of assignedAccessibleTables) {
            const tableEntry = tableAssignments[tableId];
            if (tableEntry && tableEntry.seatsUsed < tableEntry.maxSeats) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
              seated = true;
              break;
            }
          }

          // If not possible, check if guest has location preference
          if (!seated && guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
            const matchingTableEntry = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
            if (matchingTableEntry) {
              const seatNumber = matchingTableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: matchingTableEntry.table.EventTableID,
                TableID: matchingTableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: matchingTableEntry.tableLocation
              };
              assignment.push({ guest, seat });
              matchingTableEntry.seatsUsed++;
              seated = true;
            }
          }

          // If still not seated, use any available table
          if (!seated) {
            const tableEntry = Object.values(tableAssignments).find(t => t.seatsUsed < t.maxSeats);
            if (tableEntry) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
            }
          }
        });

        // Remove this family from the regular families list to avoid double assignment
        const index = sortedFamilies.findIndex(f => f[0].ContactInfo === family[0].ContactInfo);
        if (index !== -1) {
          sortedFamilies.splice(index, 1);
        }
      }
    });

    // Handle remaining individual guests with accessibility needs
    const individualGuestsWithAccessibilityNeeds = guestsNeedingAccessibility.filter(guest =>
        !assignment.some(a => a.guest.GuestID === guest.GuestID)
    );

    individualGuestsWithAccessibilityNeeds.forEach(guest => {
      // Try to find accessible table with location preference
      let accessibleTable = null;
      if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
        accessibleTable = tablesByLocation[guest.Restriction]
            .filter(t => t.isAccessible && t.seatsUsed < t.maxSeats)[0];
      }

      // If no matching location, use any accessible table
      if (!accessibleTable) {
        accessibleTable = accessibleTables.find(t => t.seatsUsed < t.maxSeats);
      }

      if (accessibleTable) {
        const seatNumber = accessibleTable.seatsUsed + 1;
        const seat = {
          EventTableID: accessibleTable.table.EventTableID,
          TableID: accessibleTable.table.TableID,
          SeatNumber: seatNumber,
          TableLocation: accessibleTable.tableLocation
        };
        assignment.push({ guest, seat });
        accessibleTable.seatsUsed++;
      } else {
        // If no accessible tables are available, log a warning
        console.warn(`No accessible tables available for guest ${guest.FullName} who needs accessibility`);
      }
    });

    // STEP 2: Now handle remaining families (without accessibility needs)
    sortedFamilies.forEach(family => {
      // Check if family members have location preferences
      const locationPreference = family.find(member => member.Restriction && !member.Restriction.includes(','))?.Restriction;

      // Try to find a table with matching location if possible
      let tableEntry = null;
      if (locationPreference && tablesByLocation[locationPreference]) {
        tableEntry = tablesByLocation[locationPreference]
            .find(t => (t.maxSeats - t.seatsUsed) >= family.length);
      }

      // If no matching location or not enough seats, fall back to any table
      if (!tableEntry) {
        tableEntry = Object.values(tableAssignments)
            .find(t => (t.maxSeats - t.seatsUsed) >= family.length);
      }

      if (tableEntry) {
        // Assign all family members to this table
        family.forEach(guest => {
          const seatNumber = tableEntry.seatsUsed + 1;
          const seat = {
            EventTableID: tableEntry.table.EventTableID,
            TableID: tableEntry.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: tableEntry.tableLocation
          };
          assignment.push({ guest, seat });
          tableEntry.seatsUsed++;
        });
      } else {
        // If no table has enough space, we'll have to split the family
        // But this should be avoided if possible by using larger tables
        console.warn(`Could not seat family with ${family.length} members together. Will need to split.`);

        // Try to keep as many family members together as possible
        family.forEach(guest => {
          let seated = false;

          // Try to match location preference if possible
          if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
            const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
            if (matchingTable) {
              const seatNumber = matchingTable.seatsUsed + 1;
              const seat = {
                EventTableID: matchingTable.table.EventTableID,
                TableID: matchingTable.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: matchingTable.tableLocation
              };
              assignment.push({ guest, seat });
              matchingTable.seatsUsed++;
              seated = true;
            }
          }

          // If not matched by location, use any available seat
          if (!seated) {
            // Find table with available seats
            const tableEntry = Object.values(tableAssignments).find(t => t.seatsUsed < t.maxSeats);
            if (tableEntry) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
            }
          }
        });
      }
    });

    // 3. Now handle preference groups for remaining guests
    const assignedIDs = assignment.map(a => a.guest.GuestID);
    const remainingGuests = guests.filter(g => !assignedIDs.includes(g.GuestID));

    // Find all unique group names from Preferences
    const allGroups = Array.from(new Set(remainingGuests.map(g => (g.Preferences || '').split(',')).flat().map(s => s.trim()).filter(Boolean)));

    // Assign each preference group to tables
    allGroups.forEach(group => {
      // Find all guests in this group
      const groupGuests = remainingGuests.filter(g =>
          (g.Preferences || '').split(',').map(s => s.trim()).includes(group) &&
          !assignedIDs.includes(g.GuestID)
      );

      if (groupGuests.length > 0) {
        // Check if any group members have location preferences
        const locationPreferences = groupGuests
            .filter(g => g.Restriction && !g.Restriction.includes(','))
            .map(g => g.Restriction);

        // Find most common location preference
        let commonLocation = null;
        if (locationPreferences.length > 0) {
          const locationCounts = {};
          locationPreferences.forEach(loc => {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          });
          commonLocation = Object.keys(locationCounts).reduce((a, b) =>
              locationCounts[a] > locationCounts[b] ? a : b, locationPreferences[0]);
        }

        // Try to find a table with matching location if possible
        let tableEntry = null;
        if (commonLocation && tablesByLocation[commonLocation]) {
          tableEntry = tablesByLocation[commonLocation]
              .find(t => (t.maxSeats - t.seatsUsed) >= groupGuests.length);
        }

        // If no matching location or not enough seats, fall back to any table
        if (!tableEntry) {
          tableEntry = Object.values(tableAssignments)
              .find(t => (t.maxSeats - t.seatsUsed) >= groupGuests.length);
        }

        if (tableEntry) {
          // Assign all group members to this table
          groupGuests.forEach(guest => {
            const seatNumber = tableEntry.seatsUsed + 1;
            const seat = {
              EventTableID: tableEntry.table.EventTableID,
              TableID: tableEntry.table.TableID,
              SeatNumber: seatNumber,
              TableLocation: tableEntry.tableLocation
            };
            assignment.push({ guest, seat });
            tableEntry.seatsUsed++;
            assignedIDs.push(guest.GuestID);
          });
        } else {
          // If no table has enough space, assign them to tables with available seats
          groupGuests.forEach(guest => {
            if (!assignedIDs.includes(guest.GuestID)) {
              let seated = false;

              // Try to match location preference if possible
              if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
                const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
                if (matchingTable) {
                  const seatNumber = matchingTable.seatsUsed + 1;
                  const seat = {
                    EventTableID: matchingTable.table.EventTableID,
                    TableID: matchingTable.table.TableID,
                    SeatNumber: seatNumber,
                    TableLocation: matchingTable.tableLocation
                  };
                  assignment.push({ guest, seat });
                  matchingTable.seatsUsed++;
                  seated = true;
                  assignedIDs.push(guest.GuestID);
                }
              }

              // If not matched by location, use any available seat
              if (!seated) {
                const tableEntry = Object.values(tableAssignments)
                    .find(t => t.seatsUsed < t.maxSeats);

                if (tableEntry) {
                  const seatNumber = tableEntry.seatsUsed + 1;
                  const seat = {
                    EventTableID: tableEntry.table.EventTableID,
                    TableID: tableEntry.table.TableID,
                    SeatNumber: seatNumber,
                    TableLocation: tableEntry.tableLocation
                  };
                  assignment.push({ guest, seat });
                  tableEntry.seatsUsed++;
                  assignedIDs.push(guest.GuestID);
                }
              }
            }
          });
        }
      }
    });

    // 4. Assign any remaining guests
    const finalRemainingGuests = guests.filter(g => !assignedIDs.includes(g.GuestID));

    finalRemainingGuests.forEach(guest => {
      let seated = false;

      // Try to match location preference if possible
      if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
        const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
        if (matchingTable) {
          const seatNumber = matchingTable.seatsUsed + 1;
          const seat = {
            EventTableID: matchingTable.table.EventTableID,
            TableID: matchingTable.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: matchingTable.tableLocation
          };
          assignment.push({ guest, seat });
          matchingTable.seatsUsed++;
          seated = true;
        }
      }

      // If not matched by location, use any available seat
      if (!seated) {
        // Find a table with available seats
        const tableEntry = Object.values(tableAssignments)
            .find(t => t.seatsUsed < t.maxSeats);

        if (tableEntry) {
          const seatNumber = tableEntry.seatsUsed + 1;
          const seat = {
            EventTableID: tableEntry.table.EventTableID,
            TableID: tableEntry.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: tableEntry.tableLocation
          };
          assignment.push({ guest, seat });
          tableEntry.seatsUsed++;
        }
      }
    });

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
    // NEW: +2000 for guest seated at table with matching TableLocation to their Restriction
    function scoreAssignment(assign) {
      let score = 0;

      // --- Table Location preferences (NEW, HIGH priority) ---
      assign.forEach(a => {
        // If guest has a simple location restriction (not containing commas)
        if (a.guest.Restriction && !a.guest.Restriction.includes(',')) {
          // Get the table location
          const tableLocation = a.seat.TableLocation;

          // If location matches guest's preference - MAJOR bonus
          if (tableLocation && tableLocation === a.guest.Restriction) {
            score += 2000; // High priority but below accessibility
          }
        }
      });

      // --- Accessibility needs (HIGHEST priority) ---
      // Check if guests with accessibility needs are seated at accessible tables
      assign.forEach(a => {
        // If guest needs accessible table
        if (a.guest.NeedsAccessibleTable === 1) {
          // Get the table information
          const tableInfo = eventTables.find(t => t.EventTableID === a.seat.EventTableID);

          if (tableInfo && tableInfo.IsAccessible === 1) {
            // Guest with accessibility needs is at an accessible table - EXTREME bonus
            score += 10000; // Higher than any other bonus
          } else {
            // Guest with accessibility needs is NOT at an accessible table - EXTREME penalty
            score -= 10000; // This should be avoided at all costs
          }
        }
      });

      // --- Family members logic (high priority) ---
      // Group guests by ContactInfo (family members)
      const contactGroups = {};
      assign.forEach(a => {
        if (a.guest.ContactInfo) {
          if (!contactGroups[a.guest.ContactInfo]) {
            contactGroups[a.guest.ContactInfo] = [];
          }
          contactGroups[a.guest.ContactInfo].push(a);
        }
      });

      // Heavily reward keeping family members together
      Object.values(contactGroups).forEach(familyMembers => {
        if (familyMembers.length > 1) {
          // Check if all family members are at the same table
          const tables = Array.from(new Set(familyMembers.map(a => a.seat.TableID)));
          if (tables.length === 1) {
            // All family members at the same table - MAJOR bonus
            score += 5000; // High priority but below accessibility
          } else {
            // Family is split - MAJOR penalty
            score -= 5000;
          }
        }
      });

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

// latest version with wheelchair priority
const optimizeSeatingArrangement = async (eventId) => {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1. Fetch all guests for the event
    const [guests] = await conn.query('SELECT * FROM guests WHERE EventID = ?', [eventId]);
    // 2. Fetch all event tables for the event (with seat counts and accessibility info)
    const [eventTables] = await conn.query(`
      SELECT et.EventTableID, et.TableID, t.MaxSeats, t.TableLocation, t.IsAccessible 
      FROM event_tables et
      JOIN tables t ON et.TableID = t.TableID
      WHERE et.EventID = ?
    `, [eventId]);

    if (!guests.length || !eventTables.length) return { success: false, error: 'No guests or tables for this event' };

    // 3. Remove all existing seating for this event
    await conn.query(`DELETE sa FROM seatingarrangement sa JOIN event_tables et ON sa.EventTableID = et.EventTableID WHERE et.EventID = ?`, [eventId]);

    // --- Tabu Search Setup ---
    // Flatten seats: [{EventTableID, TableID, SeatNumber, IsAccessible} ...]
    const seats = [];
    eventTables.forEach(table => {
      for (let i = 1; i <= table.MaxSeats; i++) {
        seats.push({
          EventTableID: table.EventTableID,
          TableID: table.TableID,
          SeatNumber: i,
          TableLocation: table.TableLocation,
          IsAccessible: table.IsAccessible === 1 || table.TableID === 61  // Ensure Table 61 is always marked as accessible
        });
      }
    });

    if (guests.length > seats.length) return { success: false, error: 'Not enough seats for all guests' };

    // Initialize assignments and tracking
    let assignment = [];
    let tableAssignments = {};

    // Initialize table assignments
    eventTables.forEach(table => {
      tableAssignments[table.EventTableID] = {
        table: table,
        seatsUsed: 0,
        maxSeats: table.MaxSeats,
        // Ensure Table 61 is always marked as accessible
        isAccessible: table.IsAccessible === 1 || table.TableID === 61,
        tableLocation: table.TableLocation
      };
    });

    // Identify accessible tables - IMPORTANT: Ensure Table 61 is always in this list
    const accessibleTables = Object.values(tableAssignments).filter(t =>
        t.isAccessible || t.table.TableID === 61
    );
    const regularTables = Object.values(tableAssignments).filter(t =>
        !t.isAccessible && t.table.TableID !== 61
    );

    // Validate that we have at least one accessible table
    if (accessibleTables.length === 0) {
      console.error("No accessible tables found! Marking Table 61 as accessible.");
      // Find Table 61 and mark it accessible
      const table61 = Object.values(tableAssignments).find(t => t.table.TableID === 61);
      if (table61) {
        table61.isAccessible = true;
        accessibleTables.push(table61);
      }
    }

    // Group tables by location
    const tablesByLocation = {};
    Object.values(tableAssignments).forEach(tableEntry => {
      if (tableEntry.tableLocation) {
        if (!tablesByLocation[tableEntry.tableLocation]) {
          tablesByLocation[tableEntry.tableLocation] = [];
        }
        tablesByLocation[tableEntry.tableLocation].push(tableEntry);
      }
    });

    // STEP 0: Identify all guests who need wheelchair accessibility
    const guestsNeedingAccessibility = guests.filter(g =>
        g.NeedsAccessibleTable === 1 ||
        g.FullName?.toLowerCase().includes('wheelchair')
    );

    console.log(`Found ${guestsNeedingAccessibility.length} guests needing wheelchair accessibility`);
    console.log(`Found ${accessibleTables.length} accessible tables with total ${accessibleTables.reduce((sum, t) => sum + t.maxSeats, 0)} seats`);

    // Group guests by ContactInfo (family members)
    const contactGroups = {};
    guests.forEach(guest => {
      if (guest.ContactInfo) {
        if (!contactGroups[guest.ContactInfo]) {
          contactGroups[guest.ContactInfo] = [];
        }
        contactGroups[guest.ContactInfo].push(guest);
      }
    });

    // Sort contact groups by whether they have accessibility needs (prioritize those with needs)
    const sortedFamilies = Object.values(contactGroups)
        .filter(family => family.length > 1)
        .sort((a, b) => {
          const aHasAccessibilityNeeds = a.some(member => member.NeedsAccessibleTable === 1 || member.FullName?.toLowerCase().includes('wheelchair'));
          const bHasAccessibilityNeeds = b.some(member => member.NeedsAccessibleTable === 1 || member.FullName?.toLowerCase().includes('wheelchair'));

          if (aHasAccessibilityNeeds && !bHasAccessibilityNeeds) return -1;
          if (!aHasAccessibilityNeeds && bHasAccessibilityNeeds) return 1;
          return b.length - a.length; // Then by size
        });

    // STEP 1A: First, handle families with accessibility needs
    const familiesWithAccessibilityNeeds = sortedFamilies.filter(family =>
        family.some(member => member.NeedsAccessibleTable === 1 || member.FullName?.toLowerCase().includes('wheelchair'))
    );

    familiesWithAccessibilityNeeds.forEach(family => {
      // Check if we have enough accessible seats for the whole family
      const accessibleTableWithSpace = accessibleTables.find(t =>
          (t.maxSeats - t.seatsUsed) >= family.length
      );

      if (accessibleTableWithSpace) {
        // Assign all family members to this accessible table
        family.forEach(guest => {
          const seatNumber = accessibleTableWithSpace.seatsUsed + 1;
          const seat = {
            EventTableID: accessibleTableWithSpace.table.EventTableID,
            TableID: accessibleTableWithSpace.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: accessibleTableWithSpace.tableLocation,
            IsAccessible: true
          };
          assignment.push({ guest, seat });
          accessibleTableWithSpace.seatsUsed++;
        });

        // Remove this family from the regular families list
        const index = sortedFamilies.findIndex(f => f[0].ContactInfo === family[0].ContactInfo);
        if (index !== -1) {
          sortedFamilies.splice(index, 1);
        }
      } else {
        // Not enough space at a single accessible table for the whole family
        // At least ensure members with accessibility needs get accessible seats
        const membersNeedingAccessibility = family.filter(member =>
            member.NeedsAccessibleTable === 1 ||
            member.FullName?.toLowerCase().includes('wheelchair')
        );
        const otherMembers = family.filter(member =>
            !(member.NeedsAccessibleTable === 1 || member.FullName?.toLowerCase().includes('wheelchair'))
        );

        // Prioritize those with accessibility needs first
        membersNeedingAccessibility.forEach(guest => {
          // Find any accessible table with space
          const accessibleTable = accessibleTables.find(t => t.seatsUsed < t.maxSeats);

          if (accessibleTable) {
            const seatNumber = accessibleTable.seatsUsed + 1;
            const seat = {
              EventTableID: accessibleTable.table.EventTableID,
              TableID: accessibleTable.table.TableID,
              SeatNumber: seatNumber,
              TableLocation: accessibleTable.tableLocation,
              IsAccessible: true
            };
            assignment.push({ guest, seat });
            accessibleTable.seatsUsed++;
          } else {
            console.error(`ERROR: Could not find accessible seating for guest ${guest.FullName} who needs accessibility!`);
          }
        });

        // Try to seat other family members at the same tables if possible
        otherMembers.forEach(guest => {
          // First try to seat at the same tables as family members with accessibility needs
          const assignedAccessibleTables = assignment
              .filter(a => membersNeedingAccessibility.some(m => m.GuestID === a.guest.GuestID))
              .map(a => a.seat.EventTableID);

          let seated = false;

          // Try to seat at the same accessible table as other family members if possible
          for (const tableId of assignedAccessibleTables) {
            const tableEntry = tableAssignments[tableId];
            if (tableEntry && tableEntry.seatsUsed < tableEntry.maxSeats) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation,
                IsAccessible: tableEntry.isAccessible
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
              seated = true;
              break;
            }
          }

          // If not possible, just find any available seat
          if (!seated) {
            const tableEntry = Object.values(tableAssignments).find(t => t.seatsUsed < t.maxSeats);
            if (tableEntry) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation,
                IsAccessible: tableEntry.isAccessible
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
            }
          }
        });

        // Remove this family from the regular families list
        const index = sortedFamilies.findIndex(f => f[0].ContactInfo === family[0].ContactInfo);
        if (index !== -1) {
          sortedFamilies.splice(index, 1);
        }
      }
    });

    // STEP 1B: Handle remaining individual guests with accessibility needs
    const alreadyAssignedIds = assignment.map(a => a.guest.GuestID);
    const individualGuestsWithAccessibilityNeeds = guestsNeedingAccessibility.filter(guest =>
        !alreadyAssignedIds.includes(guest.GuestID)
    );

    individualGuestsWithAccessibilityNeeds.forEach(guest => {
      // Find any accessible table with space
      const accessibleTable = accessibleTables.find(t => t.seatsUsed < t.maxSeats);

      if (accessibleTable) {
        const seatNumber = accessibleTable.seatsUsed + 1;
        const seat = {
          EventTableID: accessibleTable.table.EventTableID,
          TableID: accessibleTable.table.TableID,
          SeatNumber: seatNumber,
          TableLocation: accessibleTable.tableLocation,
          IsAccessible: true
        };
        assignment.push({ guest, seat });
        accessibleTable.seatsUsed++;
      } else {
        console.error(`ERROR: Could not find accessible seating for individual guest ${guest.FullName} who needs accessibility!`);

        // CRITICAL: If we get here, it means we've run out of accessible seating.
        // As a fallback, we need to find any table with space and flag this issue
        const anyTable = Object.values(tableAssignments).find(t => t.seatsUsed < t.maxSeats);
        if (anyTable) {
          console.warn(`WARNING: Had to seat guest ${guest.FullName} who needs accessibility at a non-accessible table due to capacity constraints!`);
          const seatNumber = anyTable.seatsUsed + 1;
          const seat = {
            EventTableID: anyTable.table.EventTableID,
            TableID: anyTable.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: anyTable.tableLocation,
            IsAccessible: anyTable.isAccessible
          };
          assignment.push({ guest, seat });
          anyTable.seatsUsed++;
        }
      }
    });

    // STEP 2: Now handle remaining families (without accessibility needs)
    sortedFamilies.forEach(family => {
      // Check if family members have location preferences
      const locationPreference = family.find(member => member.Restriction && !member.Restriction.includes(','))?.Restriction;

      // Try to find a table with matching location if possible
      let tableEntry = null;
      if (locationPreference && tablesByLocation[locationPreference]) {
        tableEntry = tablesByLocation[locationPreference]
            .find(t => (t.maxSeats - t.seatsUsed) >= family.length);
      }

      // If no matching location or not enough seats, fall back to any table
      if (!tableEntry) {
        tableEntry = Object.values(tableAssignments)
            .find(t => (t.maxSeats - t.seatsUsed) >= family.length);
      }

      if (tableEntry) {
        // Assign all family members to this table
        family.forEach(guest => {
          const seatNumber = tableEntry.seatsUsed + 1;
          const seat = {
            EventTableID: tableEntry.table.EventTableID,
            TableID: tableEntry.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: tableEntry.tableLocation,
            IsAccessible: tableEntry.isAccessible
          };
          assignment.push({ guest, seat });
          tableEntry.seatsUsed++;
        });
      } else {
        // If no table has enough space, we'll have to split the family
        console.warn(`Could not seat family with ${family.length} members together. Will need to split.`);

        // Try to keep as many family members together as possible
        family.forEach(guest => {
          let seated = false;

          // Try to match location preference if possible
          if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
            const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
            if (matchingTable) {
              const seatNumber = matchingTable.seatsUsed + 1;
              const seat = {
                EventTableID: matchingTable.table.EventTableID,
                TableID: matchingTable.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: matchingTable.tableLocation,
                IsAccessible: matchingTable.isAccessible
              };
              assignment.push({ guest, seat });
              matchingTable.seatsUsed++;
              seated = true;
            }
          }

          // If not matched by location, use any available seat
          if (!seated) {
            // Find table with available seats
            const tableEntry = Object.values(tableAssignments).find(t => t.seatsUsed < t.maxSeats);
            if (tableEntry) {
              const seatNumber = tableEntry.seatsUsed + 1;
              const seat = {
                EventTableID: tableEntry.table.EventTableID,
                TableID: tableEntry.table.TableID,
                SeatNumber: seatNumber,
                TableLocation: tableEntry.tableLocation,
                IsAccessible: tableEntry.isAccessible
              };
              assignment.push({ guest, seat });
              tableEntry.seatsUsed++;
            }
          }
        });
      }
    });

    // Handle remaining guests (rest of the algorithm remains similar)
    // 3. Now handle preference groups for remaining guests
    const assignedIDs = assignment.map(a => a.guest.GuestID);
    const remainingGuests = guests.filter(g => !assignedIDs.includes(g.GuestID));

    // Find all unique group names from Preferences
    const allGroups = Array.from(new Set(remainingGuests.map(g => (g.Preferences || '').split(',')).flat().map(s => s.trim()).filter(Boolean)));

    // Assign each preference group to tables
    allGroups.forEach(group => {
      // Find all guests in this group
      const groupGuests = remainingGuests.filter(g =>
          (g.Preferences || '').split(',').map(s => s.trim()).includes(group) &&
          !assignedIDs.includes(g.GuestID)
      );

      if (groupGuests.length > 0) {
        // Check if any group members have location preferences
        const locationPreferences = groupGuests
            .filter(g => g.Restriction && !g.Restriction.includes(','))
            .map(g => g.Restriction);

        // Find most common location preference
        let commonLocation = null;
        if (locationPreferences.length > 0) {
          const locationCounts = {};
          locationPreferences.forEach(loc => {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          });
          commonLocation = Object.keys(locationCounts).reduce((a, b) =>
              locationCounts[a] > locationCounts[b] ? a : b, locationPreferences[0]);
        }

        // Try to find a table with matching location if possible
        let tableEntry = null;
        if (commonLocation && tablesByLocation[commonLocation]) {
          tableEntry = tablesByLocation[commonLocation]
              .find(t => (t.maxSeats - t.seatsUsed) >= groupGuests.length);
        }

        // If no matching location or not enough seats, fall back to any table
        if (!tableEntry) {
          tableEntry = Object.values(tableAssignments)
              .find(t => (t.maxSeats - t.seatsUsed) >= groupGuests.length);
        }

        if (tableEntry) {
          // Assign all group members to this table
          groupGuests.forEach(guest => {
            const seatNumber = tableEntry.seatsUsed + 1;
            const seat = {
              EventTableID: tableEntry.table.EventTableID,
              TableID: tableEntry.table.TableID,
              SeatNumber: seatNumber,
              TableLocation: tableEntry.tableLocation,
              IsAccessible: tableEntry.isAccessible
            };
            assignment.push({ guest, seat });
            tableEntry.seatsUsed++;
            assignedIDs.push(guest.GuestID);
          });
        } else {
          // If no table has enough space, assign them to tables with available seats
          groupGuests.forEach(guest => {
            if (!assignedIDs.includes(guest.GuestID)) {
              let seated = false;

              // Try to match location preference if possible
              if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
                const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
                if (matchingTable) {
                  const seatNumber = matchingTable.seatsUsed + 1;
                  const seat = {
                    EventTableID: matchingTable.table.EventTableID,
                    TableID: matchingTable.table.TableID,
                    SeatNumber: seatNumber,
                    TableLocation: matchingTable.tableLocation,
                    IsAccessible: matchingTable.isAccessible
                  };
                  assignment.push({ guest, seat });
                  matchingTable.seatsUsed++;
                  seated = true;
                  assignedIDs.push(guest.GuestID);
                }
              }

              // If not matched by location, use any available seat
              if (!seated) {
                const tableEntry = Object.values(tableAssignments)
                    .find(t => t.seatsUsed < t.maxSeats);

                if (tableEntry) {
                  const seatNumber = tableEntry.seatsUsed + 1;
                  const seat = {
                    EventTableID: tableEntry.table.EventTableID,
                    TableID: tableEntry.table.TableID,
                    SeatNumber: seatNumber,
                    TableLocation: tableEntry.tableLocation,
                    IsAccessible: tableEntry.isAccessible
                  };
                  assignment.push({ guest, seat });
                  tableEntry.seatsUsed++;
                  assignedIDs.push(guest.GuestID);
                }
              }
            }
          });
        }
      }
    });

    // 4. Assign any remaining guests
    const finalRemainingGuests = guests.filter(g => !assignedIDs.includes(g.GuestID));

    finalRemainingGuests.forEach(guest => {
      let seated = false;

      // Try to match location preference if possible
      if (guest.Restriction && !guest.Restriction.includes(',') && tablesByLocation[guest.Restriction]) {
        const matchingTable = tablesByLocation[guest.Restriction].find(t => t.seatsUsed < t.maxSeats);
        if (matchingTable) {
          const seatNumber = matchingTable.seatsUsed + 1;
          const seat = {
            EventTableID: matchingTable.table.EventTableID,
            TableID: matchingTable.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: matchingTable.tableLocation,
            IsAccessible: matchingTable.isAccessible
          };
          assignment.push({ guest, seat });
          matchingTable.seatsUsed++;
          seated = true;
        }
      }

      // If not matched by location, use any available seat
      if (!seated) {
        // Find a table with available seats
        const tableEntry = Object.values(tableAssignments)
            .find(t => t.seatsUsed < t.maxSeats);

        if (tableEntry) {
          const seatNumber = tableEntry.seatsUsed + 1;
          const seat = {
            EventTableID: tableEntry.table.EventTableID,
            TableID: tableEntry.table.TableID,
            SeatNumber: seatNumber,
            TableLocation: tableEntry.tableLocation,
            IsAccessible: tableEntry.isAccessible
          };
          assignment.push({ guest, seat });
          tableEntry.seatsUsed++;
        }
      }
    });

    // Tabu Search Optimization
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

    // Score function with updated priorities
    function scoreAssignment(assign) {
      let score = 0;

      // --- Accessibility needs (HIGHEST priority) ---
      // Check if guests with accessibility needs are seated at accessible tables
      assign.forEach(a => {
        // If guest needs accessible table
        if (a.guest.NeedsAccessibleTable === 1 || a.guest.FullName?.toLowerCase().includes('wheelchair')) {
          // Is the seat at an accessible table?
          const isAtAccessibleTable = a.seat.IsAccessible ||
              a.seat.TableID === 61 || // Table 61 is explicitly accessible
              accessibleTables.some(t => t.table.EventTableID === a.seat.EventTableID);

          if (isAtAccessibleTable) {
            // Guest with accessibility needs is at an accessible table - EXTREME bonus
            score += 50000; // Higher than any other bonus
          } else {
            // Guest with accessibility needs is NOT at an accessible table - EXTREME penalty
            score -= 50000; // This should be avoided at all costs
            console.error(`Guest ${a.guest.FullName} needs accessibility but is at non-accessible table ${a.seat.TableID}`);
          }
        }
      });

      // --- Table Location preferences (high priority) ---
      assign.forEach(a => {
        // If guest has a simple location restriction (not containing commas)
        if (a.guest.Restriction && !a.guest.Restriction.includes(',')) {
          // Get the table location
          const tableLocation = a.seat.TableLocation;

          // If location matches guest's preference - MAJOR bonus
          if (tableLocation && tableLocation === a.guest.Restriction) {
            score += 2000; // High priority but below accessibility
          }
        }
      });

      // --- Family members logic (high priority) ---
      // Group guests by ContactInfo (family members)
      const contactGroups = {};
      assign.forEach(a => {
        if (a.guest.ContactInfo) {
          if (!contactGroups[a.guest.ContactInfo]) {
            contactGroups[a.guest.ContactInfo] = [];
          }
          contactGroups[a.guest.ContactInfo].push(a);
        }
      });

      // Heavily reward keeping family members together
      Object.values(contactGroups).forEach(familyMembers => {
        if (familyMembers.length > 1) {
          // Check if all family members are at the same table
          const tables = Array.from(new Set(familyMembers.map(a => a.seat.TableID)));
          if (tables.length === 1) {
            // All family members at the same table - MAJOR bonus
            score += 5000; // High priority but below accessibility
          } else {
            // Family is split - MAJOR penalty
            score -= 5000;
          }
        }
      });

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

      // --- Original scoring for preferences and restrictions ---
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
            if (other.guest.Preferences && other.guest.Preferences.split(',').map(s => s.trim()).includes(pref)) {
              score += 1;
            }
            if (other.guest.Restrictions && other.guest.Restrictions.split(',').map(s => s.trim()).includes(pref)) {
              score += 1;
            }
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
          // Skip swaps that would move a guest who needs accessibility to a non-accessible table
          const guestANeedsAccessibility = assignment[i].guest.NeedsAccessibleTable === 1 ||
              assignment[i].guest.FullName?.toLowerCase().includes('wheelchair');
          const guestBNeedsAccessibility = assignment[j].guest.NeedsAccessibleTable === 1 ||
              assignment[j].guest.FullName?.toLowerCase().includes('wheelchair');

          const seatAIsAccessible = assignment[i].seat.IsAccessible || assignment[i].seat.TableID === 61;
          const seatBIsAccessible = assignment[j].seat.IsAccessible || assignment[j].seat.TableID === 61;

          // Don't swap if it would create an accessibility violation
          if ((guestANeedsAccessibility && !seatBIsAccessible) ||
              (guestBNeedsAccessibility && !seatAIsAccessible)) {
            continue;
          }

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
