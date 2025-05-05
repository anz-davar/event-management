import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Table } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const TableManagementPage = () => {
    const { eventId } = useParams();
    const [hallId, setHallId] = useState(null);
    useNavigate();
    const [tables, setTables] = useState([]);
    const [eventTables, setEventTables] = useState([]); // Tables assigned to this event
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [maxSeats, setMaxSeats] = useState('');
    const [tableLocation, setTableLocation] = useState('');
    const [isAccessible, setIsAccessible] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        const fetchEventAndTables = async () => {
            try {
                setLoading(true);
                const eventResponse = await axios.get(`/api/events/${eventId}`);
                setEvent(eventResponse.data.data || null);
                const hallId = eventResponse.data.data.HallID;
                setHallId(hallId);
                const tablesResponse = await axios.get(`/api/tables/hall/${hallId}`);
                setTables(tablesResponse.data.data || []);
                // Fetch tables assigned to this event
                const eventTablesResponse = await axios.get(`/api/eventtables/${eventId}`);
                setEventTables(eventTablesResponse.data.data.map(et => et.TableID) || []);
                setError('');
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndTables();
    }, [eventId]);

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            const tableData = {
                HallID: hallId,
                MaxSeats: parseInt(maxSeats),
                TableLocation: tableLocation,
                IsAccessible: isAccessible ? 1 : 0
            };
            const response = await axios.post('/api/tables', tableData);
            if (response.data.success) {
                setSuccess('Table added successfully');
                closeAddModal();
                const tablesResponse = await axios.get(`/api/tables/hall/${hallId}`);
                setTables(tablesResponse.data.data || []);
            } else {
                setError(response.data.error || 'Failed to add table');
            }
        } catch (error) {
            console.error('Error adding table:', error);
            setError('Failed to add table');
        }
    };

    const handleEditTable = async (e) => {
        e.preventDefault();
        try {
            const tableData = {
                TableID: currentTable.TableID,
                HallID: hallId,
                MaxSeats: parseInt(maxSeats),
                TableLocation: tableLocation,
                IsAccessible: isAccessible ? 1 : 0
            };
            const response = await axios.put(`/api/tables/${currentTable.TableID}`, tableData);
            if (response.data.success) {
                setSuccess('Table updated successfully');
                closeEditModal();
                const tablesResponse = await axios.get(`/api/tables/hall/${hallId}`);
                setTables(tablesResponse.data.data || []);
            } else {
                setError(response.data.error || 'Failed to update table');
            }
        } catch (error) {
            console.error('Error updating table:', error);
            setError('Failed to update table');
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            try {
                const response = await axios.delete(`/api/tables/${tableId}`);
                if (response.data.success) {
                    setSuccess('Table deleted successfully');
                    const tablesResponse = await axios.get(`/api/tables/hall/${hallId}`);
                    setTables(tablesResponse.data.data || []);
                } else {
                    setError(response.data.error || 'Failed to delete table');
                }
            } catch (error) {
                console.error('Error deleting table:', error);
                setError('Failed to delete table');
            }
        }
    };

    const openAddModal = () => {
        setMaxSeats('');
        setTableLocation('');
        setIsAccessible(false);
        setShowAddModal(true);
    };
    const closeAddModal = () => setShowAddModal(false);
    const openEditModal = (table) => {
        setCurrentTable(table);
        setMaxSeats(table.MaxSeats.toString());
        setTableLocation(table.TableLocation);
        setIsAccessible(table.IsAccessible === 1);
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
    };

    const renderSeats = (count, color = '#2d7af6') => {
        const seats = [];
        for (let i = 0; i < count; i++) {
            seats.push(
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, margin: '2px' }} />
            );
        }
        return <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '100px' }}>{seats}</div>;
    };

    const TableSketch = ({ table, isReserve }) => {
        const color = isReserve ? '#28a745' : '#2d7af6';
        return (
            <div
                style={{
                    width: '100px',
                    height: '60px',
                    backgroundColor: color,
                    borderRadius: '5px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                }}
            >
                {table.TableLocation}
            </div>
        );
    };

    // Handler for toggling assignment
    const handleToggleTableAssignment = async (tableId, checked) => {
        try {
            if (checked) {
                // Assign table to event
                await axios.post('/api/eventtables', { EventID: eventId, TableID: tableId });
            } else {
                // Unassign table from event
                await axios.delete(`/api/eventtables/${eventId}/${tableId}`);
            }
            // Refresh event tables
            const eventTablesResponse = await axios.get(`/api/eventtables/${eventId}`);
            setEventTables(eventTablesResponse.data.data.map(et => et.TableID) || []);
        } catch (error) {
            console.error('Error toggling table assignment:', error);
            setError('Failed to update table assignment');
        }
    };

    return (
        <div>
            <Container className="mt-4">
                <h1>Table Management</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Tables for {event?.EventName}</h2>
                    <Button variant="primary" onClick={openAddModal}>Add New Table</Button>
                </div>

                <div className="mb-4">
                    <h3>Assign Tables to Event</h3>
                    <Row>
                        {tables.map(table => (
                            <Col key={table.TableID} xs={12} md={6} lg={4} className="mb-3">
                                <Card>
                                    <Card.Body className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <TableSketch table={table} isReserve={eventTables.includes(table.TableID)} />
                                            <div>
                                                <strong>Seats:</strong> {table.MaxSeats}
                                            </div>
                                            <div>
                                                <strong>Location:</strong> {table.TableLocation}
                                            </div>
                                            <div>
                                                <strong>Wheelchair Accessible:</strong> {table.IsAccessible === 1 ? 'Yes' : 'No'}
                                            </div>
                                        </div>
                                        <Form.Check
                                            type="switch"
                                            id={`table-switch-${table.TableID}`}
                                            label="Assign to Event"
                                            checked={eventTables.includes(table.TableID)}
                                            onChange={(e) => handleToggleTableAssignment(table.TableID, e.target.checked)}
                                        />
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                <div>
                    <h3>All Tables</h3>
                    {loading ? (
                        <p>Loading tables...</p>
                    ) : (
                        <Table striped bordered hover>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Seats</th>
                                <th>Location</th>
                                <th>Wheelchair Accessible</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tables.map((table, index) => (
                                <tr key={table.TableID}>
                                    <td>{index + 1}</td>
                                    <td>{table.MaxSeats} seats</td>
                                    <td>{table.TableLocation}</td>
                                    <td>{table.IsAccessible === 1 ? 'Yes' : 'No'}</td>
                                    <td>
                                        {table.OccupiedSeats
                                            ? `${table.OccupiedSeats}/${table.MaxSeats} occupied`
                                            : 'Empty'}
                                    </td>
                                    <td>
                                        <Button variant="warning" size="sm" className="me-2" onClick={() => openEditModal(table)}>
                                            Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteTable(table.TableID)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            </Container>

            {/* Add Table Modal */}
            <Modal show={showAddModal} onHide={closeAddModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Table</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddTable}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Maximum Seats</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter number of seats"
                                value={maxSeats}
                                onChange={(e) => setMaxSeats(e.target.value)}
                                min="1"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Table Location</Form.Label>
                            <Form.Select
                                value={tableLocation}
                                onChange={(e) => setTableLocation(e.target.value)}
                                required
                            >
                                <option value="">Select a location</option>
                                <option value="near stage">Near Stage</option>
                                <option value="center">Center</option>
                                <option value="front">Front</option>
                                <option value="back">Back</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Wheelchair Accessible Table"
                                checked={isAccessible}
                                onChange={(e) => setIsAccessible(e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                                Check this if the table is accessible for guests with wheelchairs
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeAddModal}>Cancel</Button>
                        <Button variant="primary" type="submit">Add Table</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Table Modal */}
            <Modal show={showEditModal} onHide={closeEditModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Table</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditTable}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Maximum Seats</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter number of seats"
                                value={maxSeats}
                                onChange={(e) => setMaxSeats(e.target.value)}
                                min="1"
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Table Location</Form.Label>
                            <Form.Select
                                value={tableLocation}
                                onChange={(e) => setTableLocation(e.target.value)}
                                required
                            >
                                <option value="">Select a location</option>
                                <option value="near stage">Near Stage</option>
                                <option value="center">Center</option>
                                <option value="front">Front</option>
                                <option value="back">Back</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Wheelchair Accessible Table"
                                checked={isAccessible}
                                onChange={(e) => setIsAccessible(e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                                Check this if the table is accessible for guests with wheelchairs
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
                        <Button variant="primary" type="submit">Save Changes</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default TableManagementPage;
