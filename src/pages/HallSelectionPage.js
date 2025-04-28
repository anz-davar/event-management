import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HallSelectionPage = () => {
    const [halls, setHalls] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentHall, setCurrentHall] = useState(null);
    const navigate = useNavigate();

    // Form states
    const [hallName, setHallName] = useState('');
    const [maxCapacity, setMaxCapacity] = useState('');
    const [location, setLocation] = useState('');
    const [eventType, setEventType] = useState('');

    useEffect(() => {
        fetchHalls();
    }, []);

    const fetchHalls = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/halls');
            setHalls(Array.isArray(response.data.halls) ? response.data.halls : (response.data.data && Array.isArray(response.data.data.halls) ? response.data.data.halls : []));
            setError('');
        } catch (error) {
            setError('Failed to load halls');
            console.error('Error fetching halls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHall = async (e) => {
        e.preventDefault();
        try {
            const hallData = {
                HallName: hallName,
                MaxCapacity: parseInt(maxCapacity),
                Location: location,
                EventType: eventType
            };
            await axios.post('/api/halls', hallData);
            closeAddModal();
            fetchHalls();
        } catch (error) {
            setError('Failed to add hall');
            console.error('Error adding hall:', error);
        }
    };

    const handleEditHall = async (e) => {
        e.preventDefault();
        try {
            const hallData = {
                HallID: currentHall.HallID,
                HallName: hallName,
                MaxCapacity: parseInt(maxCapacity),
                Location: location,
                EventType: eventType
            };
            await axios.put(`/api/halls`, hallData);
            closeEditModal();
            fetchHalls();
        } catch (error) {
            setError('Failed to update hall');
            console.error('Error updating hall:', error);
        }
    };

    const handleDeleteHall = async (hallId) => {
        if (window.confirm('Are you sure you want to delete this hall?')) {
            try {
                await axios.delete(`/api/halls/${hallId}`);
                fetchHalls();
            } catch (error) {
                setError('Failed to delete hall');
                console.error('Error deleting hall:', error);
            }
        }
    };

    const handleSelectHall = (hall) => {
        // Navigate to event creation or management with selected hall
        navigate(`/create-event?hallId=${hall.HallID}`);
    };

    const openAddModal = () => {
        setHallName('');
        setMaxCapacity('');
        setLocation('');
        setEventType('');
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const openEditModal = (hall) => {
        setCurrentHall(hall);
        setHallName(hall.HallName);
        setMaxCapacity(hall.MaxCapacity);
        setLocation(hall.Location);
        setEventType(hall.EventType);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setCurrentHall(null);
    };

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.Role === 'admin';

    // Filter halls based on search
    const filteredHalls = halls.filter(hall => {
        const q = search.toLowerCase();
        return (
            hall.HallName.toLowerCase().includes(q) ||
            (hall.Location && hall.Location.toLowerCase().includes(q)) ||
            (hall.EventType && hall.EventType.toLowerCase().includes(q))
        );
    });

    return (
        <Container>
            {/* Modern search bar UI */}
            <div style={{ background: 'linear-gradient(135deg, #7f53ac 0%, #647dee 100%)', padding: '48px 0', borderRadius: 24, marginBottom: 32 }}>
                <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 36, textAlign: 'center' }}>
                    <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Find Your Perfect Hall</h2>
                    <div style={{ color: '#555', marginBottom: 20, fontSize: 18 }}>Search and select from our amazing venues</div>
                    <div style={{ position: 'relative', margin: '0 auto', maxWidth: 340 }}>
                        <input
                            type="text"
                            placeholder="Select the desired hall"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                border: 'none',
                                background: '#f5f6fa',
                                borderRadius: 14,
                                padding: '18px 48px 18px 18px',
                                fontSize: 18,
                                color: '#333',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                outline: 'none',
                                fontWeight: 500
                            }}
                        />
                        <span style={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#a0a0b0',
                            fontSize: 22
                        }}>
                            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="#a0a0b0" strokeWidth="2"/><path d="M20 20L17 17" stroke="#a0a0b0" strokeWidth="2" strokeLinecap="round"/></svg>
                        </span>
                    </div>
                </div>
            </div>
            <Row className="mb-4">
                <Col>
                    <h2>Venue Halls</h2>
                </Col>
                <Col className="text-end">
                    {isAdmin && (
                        <Button variant="primary" onClick={openAddModal}>Add New Hall</Button>
                    )}
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : halls.length === 0 ? (
                <Card className="text-center p-5">
                    <Card.Body>
                        <h3>No halls found</h3>
                        <p>Add a new hall to get started</p>
                        <Button variant="primary" onClick={openAddModal}>Add Hall</Button>
                    </Card.Body>
                </Card>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Hall Name</th>
                        <th>Capacity</th>
                        <th>Location</th>
                        <th>Event Type</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredHalls.map((hall, index) => (
                        <tr key={hall.HallID}>
                            <td>{index + 1}</td>
                            <td>{hall.HallName}</td>
                            <td>{hall.MaxCapacity}</td>
                            <td>{hall.Location}</td>
                            <td>{hall.EventType}</td>
                            <td>
                                <Button
                                    variant="success"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => handleSelectHall(hall)}
                                >
                                    Select
                                </Button>
                                {isAdmin && (
                                    <>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => openEditModal(hall)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteHall(hall.HallID)}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            {/* Add Hall Modal */}
            <Modal show={showAddModal} onHide={closeAddModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Hall</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddHall}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Hall Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter hall name"
                                value={hallName}
                                onChange={(e) => setHallName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Maximum Capacity</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter max capacity"
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Type</Form.Label>
                            <Form.Control
                                type="text"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                placeholder="Enter event type"
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeAddModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Add Hall
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Hall Modal */}
            <Modal show={showEditModal} onHide={closeEditModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Hall</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditHall}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Hall Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter hall name"
                                value={hallName}
                                onChange={(e) => setHallName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Maximum Capacity</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter max capacity"
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Type</Form.Label>
                            <Form.Control
                                type="text"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                placeholder="Enter event type"
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeEditModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default HallSelectionPage;
