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
                TableLocation: tableLocation
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
                TableLocation: tableLocation
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
        setShowAddModal(true);
    };
    const closeAddModal = () => setShowAddModal(false);
    const openEditModal = (table) => {
        setCurrentTable(table);
        setMaxSeats(table.MaxSeats);
        setTableLocation(table.TableLocation);
        setShowEditModal(true);
    };
    const closeEditModal = () => {
        setShowEditModal(false);
        setCurrentTable(null);
    };

    const renderSeats = (count, color = '#2d7af6') => {
        const dots = [];
        const radius = 48;
        const dotRadius = 5;
        for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            dots.push(<circle key={i} cx={x} cy={y} r={dotRadius} fill={color} />);
        }
        return dots;
    };

    const TableSketch = ({ table, isReserve }) => {
        const seats = table.MaxSeats || 8;
        const color = isReserve ? '#f66' : '#2d7af6';
        const tableShape = table.Shape === 'square'
            ? <rect x="25" y="25" width="50" height="50" rx="10" fill="#fff" stroke={color} strokeWidth="3" />
            : <circle cx="50" cy="50" r="40" fill="#fff" stroke={color} strokeWidth="3" />;
        return (
            <svg width="110" height="110" style={{ margin: 12, display: 'block' }}>
                {renderSeats(seats, color)}
                {tableShape}
                <text x="50" y="58" textAnchor="middle" fontWeight="bold" fontSize="12" fill="#222">
                    {isReserve ? 'Reserve' : `Table ${table.TableNumber}(${table.TableID})`}
                </text>
                <text x="50" y="74" textAnchor="middle" fontSize="10" fill="#444">
                    ({seats} seats)
                </text>
            </svg>
        );
    };

    // Handler for toggling assignment
    const handleToggleTableAssignment = async (tableId, checked) => {
        try {
            if (checked) {
                await axios.post('/api/eventtables', { EventID: parseInt(eventId), TableID: tableId });
            } else {
                await axios.delete('/api/eventtables', { data: { EventID: parseInt(eventId), TableID: tableId } });
            }
            // Refresh eventTables
            const eventTablesResponse = await axios.get(`/api/eventtables/${eventId}`);
            setEventTables(eventTablesResponse.data.data.map(et => et.TableID) || []);
        } catch (error) {
            setError('Failed to update table assignment');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff', padding: '32px 0' }}>
            <Container>
                <h2 className="text-center fw-bold mb-5" style={{ fontSize: '2rem' }}>
                    Table Management
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12, minHeight: 350 }}>
                    {tables.map((table, idx) => (
                        <div key={table.TableID || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <TableSketch table={{ ...table, TableNumber: idx + 1 }} />
                            <Form.Check
                                type="checkbox"
                                label="Use for Event"
                                checked={eventTables.includes(table.TableID)}
                                onChange={e => handleToggleTableAssignment(table.TableID, e.target.checked)}
                                style={{ marginTop: 8 }}
                            />
                        </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 40 }}>
                        <TableSketch table={{ TableNumber: '', MaxSeats: 10, Shape: 'circle' }} isReserve />
                    </div>
                </div>

                <div className="d-flex justify-content-center gap-4 mt-4">
                    {/*<Button style={{ borderRadius: 20, background: '#111', border: 'none', minWidth: 100, fontWeight: 600 }}>*/}
                    {/*    Send*/}
                    {/*</Button>*/}
                    {/*<Button style={{ borderRadius: 20, background: '#111', border: 'none', minWidth: 100, fontWeight: 600 }}>*/}
                    {/*    Update*/}
                    {/*</Button>*/}
                </div>

                {/* Add Table Button - always visible */}
                <div className="d-flex justify-content-end mb-3">
                    <Button variant="primary" onClick={openAddModal} style={{ fontWeight: 600, borderRadius: 20 }}>Add Table</Button>
                </div>
                <div className="mt-5">
                    {tables.length === 0 ? (
                        <Card className="text-center p-5">
                            <Card.Body>
                                <h4>No tables added yet</h4>
                                <p>Start by adding tables to your event</p>
                                <Button variant="primary" onClick={openAddModal}>Add First Table</Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                            <tr>
                                <th>Table #</th>
                                <th>Capacity</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tables.map((table) => (
                                <tr key={table.TableID}>
                                    <td>{table.TableID}</td>
                                    <td>{table.MaxSeats} seats</td>
                                    <td>{table.TableLocation}</td>
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
                            <Form.Control
                                type="text"
                                placeholder="e.g. Front, Back, Near stage"
                                value={tableLocation}
                                onChange={(e) => setTableLocation(e.target.value)}
                                required
                            />
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
                            <Form.Control
                                type="text"
                                placeholder="e.g. Front, Back, Near stage"
                                value={tableLocation}
                                onChange={(e) => setTableLocation(e.target.value)}
                                required
                            />
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
