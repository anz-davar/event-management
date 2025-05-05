import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const SeatingArrangementPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // States for data
    const [tables, setTables] = useState([]); // All hall tables
    const [eventTables, setEventTables] = useState([]); // Only tables assigned to this event
    const [guests, setGuests] = useState([]);
    const [seatingArrangements, setSeatingArrangements] = useState([]);
    const [unassignedGuests, setUnassignedGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [event, setEvent] = useState(null);

    // Fetch event details, tables, guests and seating arrangements on component mount
    useEffect(() => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch event details
                const eventResponse = await axios.get(`/api/events/${eventId}`);
                setEvent(eventResponse.data.data || null);
                const hallId = eventResponse.data.data.HallID;

                // Fetch tables for this hall
                const tablesResponse = await axios.get(`/api/tables/hall/${hallId}`);
                setTables(tablesResponse.data.data || []);
                // Fetch only tables assigned to this event
                const eventTablesResponse = await axios.get(`/api/eventtables/${eventId}`);
                setEventTables(eventTablesResponse.data.data || []);

                // Fetch guests for this event
                const guestsResponse = await axios.get(`/api/guests?eventId=${eventId}`);
                setGuests(guestsResponse.data.data || []);

                // Fetch seating arrangements for this event
                const seatingResponse = await axios.get(`/api/seatingarrangement?eventId=${eventId}`);
                setSeatingArrangements(seatingResponse.data.data || []);

                setError('');
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Calculate unassigned guests whenever guests or seating arrangements change
    useEffect(() => {
        if (guests.length > 0 && seatingArrangements.length >= 0) {
            // Find guests that don't have a seating assignment
            const assignedGuestIds = seatingArrangements.map(seat => seat.GuestID);
            const notAssigned = guests.filter(guest => !assignedGuestIds.includes(guest.GuestID));
            setUnassignedGuests(notAssigned);
        } else if (guests.length > 0) {
            // If there are no seating arrangements, all guests are unassigned
            setUnassignedGuests([...guests]);
        }
    }, [guests, seatingArrangements]);

    // Handle assigning a guest to a table
    // Helper: get assigned tables (for this event)
    const assignedTableIds = eventTables.map(et => et.TableID);

    const assignGuestToTable = async (guestId, tableId, seatNumber) => {
        try {
            // Find the next available seat number at this table
            // Only allow assignment to tables assigned to this event
            if (!assignedTableIds.includes(tableId)) {
                setError('This table is not assigned to this event');
                return;
            }

            const existingSeats = seatingArrangements
                .filter(seat => seat.TableID === tableId)
                .map(seat => seat.SeatNumber);

            const table = tables.find(t => t.TableID === tableId);
            if (!table) {
                setError('Table not found');
                return;
            }

            // Check if table is already full
            if (existingSeats.length >= table.MaxSeats) {
                setError(`Table ${tableId} is already at full capacity`);
                return;
            }

            // Find the next available seat number
            let seatNumber = 1;
            while (existingSeats.includes(seatNumber)) {
                seatNumber++;
            }
            if (seatNumber > table.MaxSeats) {
                setError('No available seats at this table');
                return;
            }

            const seatingData = {
                GuestID: guestId,
                TableID: tableId,
                SeatNumber: seatNumber, // assign to specific seat
                EventID: eventId || (event && event.EventID)
            };

            const response = await axios.post('/api/seatingarrangement', seatingData);
            if (response.data.success) {
                setSuccess('Guest assigned to table');
                // Refresh seating arrangements
                const seatingResponse = await axios.get(`/api/seatingarrangement?eventId=${eventId}`);
                if (seatingResponse.data.success) {
                    setSeatingArrangements(seatingResponse.data.data || []);
                } else {
                    setError(seatingResponse.data.error || 'Failed to load seating arrangements');
                }
            } else {
                setError(response.data.error || 'Failed to assign guest');
            }
        } catch (error) {
            console.error('Error assigning guest:', error);
            setError('Failed to assign guest');
        }
    };

    // Handle removing a guest from a table
    const removeGuestFromTable = async (seatingId) => {
        if (window.confirm('Are you sure you want to remove this guest from the table?')) {
            try {
                const response = await axios.delete(`/api/seatingarrangement/${seatingId}`);

                if (response.data.success) {
                    setSuccess('Guest removed from table');
                    // Refresh seating arrangements
                    const seatingResponse = await axios.get(`/api/seatingarrangement?eventId=${eventId}`);
                    if (seatingResponse.data.success) {
                        setSeatingArrangements(seatingResponse.data.data || []);
                    } else {
                        setError(seatingResponse.data.error || 'Failed to load seating arrangements');
                    }
                } else {
                    setError(response.data.error || 'Failed to remove guest');
                }
            } catch (error) {
                console.error('Error removing guest:', error);
                setError('Failed to remove guest');
            }
        }
    };

    // Navigate to table management page
    const goToTableManagement = () => {
        navigate(`/tables/${eventId}`);
    };

    // Navigate to guest management page
    const goToGuestManagement = () => {
        navigate(`/guests/${eventId}`);
    };

    // Helper function to get guest name by ID
    const getGuestName = (guestId) => {
        const guest = guests.find(g => g.GuestID === guestId);
        return guest ? guest.FullName : 'Unknown Guest';
    };

    // Run the auto-seating algorithm
    const runAutoSeating = async () => {
        try {
            setLoading(true);
            // Call the backend to run the Tabu Search algorithm
            const response = await axios.post(`/api/seatingarrangement/optimize/${eventId}`);
            if (response.data.success) {
                setSuccess('Auto-seating completed successfully');
                setSeatingArrangements(response.data.data || []);
            } else {
                setError(response.data.error || 'Failed to auto-arrange seats');
            }
        } catch (error) {
            console.error('Error running auto-seating:', error);
            setError('Failed to run auto-seating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                    {event && (
                        <div className="mb-4">
                            <h2>{event.EventName}</h2>
                            <p>Date: {new Date(event.EventDate).toLocaleDateString()}</p>
                            <p>Location: {event.location}</p>
                            <p>Maximum Guests: {event.MaxGuests}</p>
                        </div>
                    )}

                    <Row className="mb-4">
                        <Col>
                            <h3>Seating Arrangement</h3>
                        </Col>
                        <Col className="text-end">
                            <Button variant="primary" onClick={runAutoSeating} className="me-2">
                                Auto-Arrange Seats
                            </Button>
                            <Button variant="secondary" onClick={goToTableManagement} className="me-2">
                                Manage Tables
                            </Button>
                            <Button variant="secondary" onClick={goToGuestManagement}>
                                Manage Guests
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={8}>
                            <h4>Tables</h4>
                            {tables.length === 0 ? (
                                <Alert variant="info">No tables created for this event yet.</Alert>
                            ) : (
                                <Row>
                                    {eventTables.map(table => (
                                        <Col key={table.TableID} md={6} className="mb-3">
                                            <Card>
                                                <Card.Header>
                                                    <strong>Table {table.TableID}</strong> - {table.TableLocation || 'No Location'}
                                                    <span className="float-end">
                            {seatingArrangements.filter(seat => seat.TableID === table.TableID).length} / {table.MaxSeats} seats
                          </span>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table striped bordered hover size="sm">
                                                        <thead>
                                                        <tr>
                                                            <th>Seat #</th>
                                                            <th>Guest</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {Array.from({ length: table.MaxSeats }).map((_, index) => {
                                                            const seatNumber = index + 1;
                                                            const seatingArrangement = seatingArrangements.find(
                                                                seat => seat.TableID === table.TableID && seat.SeatNumber === seatNumber
                                                            );

                                                            return (
                                                                <tr key={seatNumber}>
                                                                    <td>{seatNumber}</td>
                                                                    <td>
                                                                        {seatingArrangement ? (
                                                                            getGuestName(seatingArrangement.GuestID)
                                                                        ) : (
                                                                            <span className="text-muted">Empty</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        {seatingArrangement ? (
                                                                            <Button
                                                                                variant="danger"
                                                                                size="sm"
                                                                                onClick={() => removeGuestFromTable(seatingArrangement.SeatingID)}
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        ) : (
                                                                            <Dropdown>
                                                                                <Dropdown.Toggle variant="success" size="sm" id={`dropdown-seat-${table.TableID}-${seatNumber}`}>
                                                                                    Assign Guest
                                                                                </Dropdown.Toggle>
                                                                                <Dropdown.Menu>
                                                                                    {unassignedGuests.length === 0 ? (
                                                                                        <Dropdown.Item disabled>No unassigned guests</Dropdown.Item>
                                                                                    ) : (
                                                                                        unassignedGuests.map(guest => (
                                                                                            <Dropdown.Item
                                                                                                key={guest.GuestID}
                                                                                                onClick={() => assignGuestToTable(guest.GuestID, table.TableID, seatNumber)}
                                                                                            >
                                                                                                {guest.FullName}
                                                                                            </Dropdown.Item>
                                                                                        ))
                                                                                    )}
                                                                                </Dropdown.Menu>
                                                                            </Dropdown>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </Col>

                        <Col md={4}>
                            <Card>
                                <Card.Header>
                                    <h4>Unassigned Guests</h4>
                                </Card.Header>
                                <Card.Body>
                                    {unassignedGuests.length === 0 ? (
                                        <Alert variant="success">All guests have been assigned to tables!</Alert>
                                    ) : (
                                        <>
                                            <p>
                                                There {unassignedGuests.length === 1 ? 'is' : 'are'} {unassignedGuests.length} unassigned {unassignedGuests.length === 1 ? 'guest' : 'guests'}.
                                            </p>
                                            <Table striped bordered hover>
                                                <thead>
                                                <tr>
                                                    <th>Guest Name</th>
                                                    <th>Actions</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {unassignedGuests.map(guest => (
                                                    <tr key={guest.GuestID}>
                                                        <td>{guest.FullName}</td>
                                                        <td>
                                                            <Dropdown>
                                                                <Dropdown.Toggle variant="primary" size="sm" id={`dropdown-guest-${guest.GuestID}`}>
                                                                    Assign to Table
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu>
                                                                    {tables.length === 0 ? (
                                                                        <Dropdown.Item disabled>No tables available</Dropdown.Item>
                                                                    ) : (
                                                                        tables.map(table => {
                                                                            const seatsAtTable = seatingArrangements.filter(seat => seat.TableID === table.TableID).length;
                                                                            const isFull = seatsAtTable >= table.MaxSeats;

                                                                            return (
                                                                                <Dropdown.Item
                                                                                    key={table.TableID}
                                                                                    onClick={() => assignGuestToTable(guest.GuestID, table.TableID)}
                                                                                    disabled={isFull}
                                                                                >
                                                                                    Table {table.TableID} {isFull ? '(Full)' : `(${seatsAtTable}/${table.MaxSeats})`}
                                                                                </Dropdown.Item>
                                                                            );
                                                                        })
                                                                    )}
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="mt-4">
                                <Card.Header>
                                    <h4>Seating Statistics</h4>
                                </Card.Header>
                                <Card.Body>
                                    <p><strong>Total Guests:</strong> {guests.length}</p>
                                    <p><strong>Seated Guests:</strong> {guests.length - unassignedGuests.length}</p>
                                    <p><strong>Unassigned Guests:</strong> {unassignedGuests.length}</p>
                                    <p><strong>Total Tables:</strong> {tables.length}</p>
                                    <p><strong>Total Seats:</strong> {tables.reduce((total, table) => total + table.MaxSeats, 0)}</p>
                                    <p><strong>Occupancy Rate:</strong> {tables.length > 0 ?
                                        (((guests.length - unassignedGuests.length) / tables.reduce((total, table) => total + table.MaxSeats, 0)) * 100).toFixed(2) : 0}%
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default SeatingArrangementPage;
