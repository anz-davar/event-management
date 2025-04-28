import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Modal, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const GuestManagementPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // States for guests data
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [event, setEvent] = useState(null);

    // States for guest form
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentGuest, setCurrentGuest] = useState(null);
    const [fullName, setFullName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [preferences, setPreferences] = useState('');
    const [restrictions, setRestrictions] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch event details and guests on component mount
    useEffect(() => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        const fetchEventAndGuests = async () => {
            try {
                setLoading(true);
                // Fetch event details
                const eventResponse = await axios.get(`/api/events/${eventId}`);
                setEvent(eventResponse.data.data);
                // Fetch guests for this event
                const guestsResponse = await axios.get(`/api/guests?eventId=${eventId}`);
                setGuests(guestsResponse.data.data || []);
                setError('');
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load event data');
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndGuests();
    }, [eventId]);

    // Handle adding a new guest
    const handleAddGuest = async (e) => {
        e.preventDefault();
        try {
            const guestData = {
                EventID: parseInt(eventId),
                FullName: fullName,
                ContactInfo: contactInfo,
                Preferences: preferences,
                Restrictions: restrictions
            };

            const response = await axios.post('/api/guests', guestData);
            if (response.data.success) {
                setSuccess('Guest added successfully');
                closeAddModal();
                // Refresh guest list
                const guestsResponse = await axios.get(`/api/guests?eventId=${eventId}`);
                setGuests(guestsResponse.data.data || []);
            } else {
                setError(response.data.error || 'Failed to add guest');
            }
        } catch (error) {
            console.error('Error adding guest:', error);
            setError('Failed to add guest');
        }
    };

    // Handle updating a guest
    const handleEditGuest = async (e) => {
        e.preventDefault();
        try {
            const guestData = {
                GuestID: currentGuest.GuestID,
                EventID: parseInt(eventId),
                FullName: fullName,
                ContactInfo: contactInfo,
                Preferences: preferences,
                Restrictions: restrictions
            };

            const response = await axios.put('/api/guests', guestData);
            if (response.data.success) {
                setSuccess('Guest updated successfully');
                closeEditModal();
                // Refresh guest list
                const guestsResponse = await axios.get(`/api/guests?eventId=${eventId}`);
                setGuests(guestsResponse.data.data || []);
            } else {
                setError(response.data.error || 'Failed to update guest');
            }
        } catch (error) {
            console.error('Error updating guest:', error);
            setError('Failed to update guest');
        }
    };

    // Handle deleting a guest
    const handleDeleteGuest = async (guestId) => {
        if (window.confirm('Are you sure you want to delete this guest?')) {
            try {
                const response = await axios.delete(`/api/guests/${guestId}`);
                if (response.data.success) {
                    setSuccess('Guest deleted successfully');
                    // Refresh guest list
                    const guestsResponse = await axios.get(`/api/guests?eventId=${eventId}`);
                    if (guestsResponse.data.success) {
                        setGuests(guestsResponse.data.data || []);
                    } else {
                        setError(guestsResponse.data.error || 'Failed to load guests');
                    }
                } else {
                    setError(response.data.error || 'Failed to delete guest');
                }
            } catch (error) {
                console.error('Error deleting guest:', error);
                setError('Failed to delete guest');
            }
        }
    };

    // Open add guest modal
    const openAddModal = () => {
        setFullName('');
        setContactInfo('');
        setPreferences('');
        setRestrictions('');
        setShowAddModal(true);
    };

    // Close add guest modal
    const closeAddModal = () => {
        setShowAddModal(false);
    };

    // Open edit guest modal
    const openEditModal = (guest) => {
        setCurrentGuest(guest);
        setFullName(guest.FullName);
        setContactInfo(guest.ContactInfo);
        setPreferences(guest.Preferences || '');
        setRestrictions(guest.Restrictions || '');
        setShowEditModal(true);
    };

    // Close edit guest modal
    const closeEditModal = () => {
        setShowEditModal(false);
        setCurrentGuest(null);
    };

    // Navigate to table management page
    const goToTableManagement = () => {
        navigate(`/events/${eventId}/tables`);
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
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                    {event && (
                        <div className="mb-4">
                            <h2>{event.EventName}</h2>
                            <p>Date: {new Date(event.EventDate).toLocaleDateString()}</p>
                            <p>Location: {event.location}</p>
                            <p>Maximum Guests: {event.MaxGuests}</p>
                            {event.Username && (
                                <p>Owner: <b>{event.Username}</b> ({event.Email})</p>
                            )}
                        </div>
                    )}

                    <Row className="mb-4">
                        <Col>
                            <h3>Guest Management</h3>
                        </Col>
                        <Col className="text-end">
                            <Button variant="primary" onClick={openAddModal} className="me-2">Add Guest</Button>
                            {/*<Button variant="success" onClick={goToTableManagement}>Manage Tables</Button>*/}
                        </Col>
                    </Row>

                    {guests.length === 0 ? (
                        <Card className="text-center p-5">
                            <Card.Body>
                                <h4>No guests added yet</h4>
                                <p>Start by adding guests to your event</p>
                                <Button variant="primary" onClick={openAddModal}>Add First Guest</Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Contact Info</th>
                                <th>Preferences</th>
                                <th>Restrictions</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {guests.map((guest, index) => (
                                <tr key={guest.GuestID}>
                                    <td>{index + 1}</td>
                                    <td>{guest.FullName}</td>
                                    <td>{guest.ContactInfo}</td>
                                    <td>{guest.Preferences || 'None'}</td>
                                    <td>{guest.Restrictions || 'None'}</td>
                                    <td>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => openEditModal(guest)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteGuest(guest.GuestID)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}

                    {/* Add Guest Modal */}
                    <Modal show={showAddModal} onHide={closeAddModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Add New Guest</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleAddGuest}>
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter guest name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contact Information</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Phone number or email"
                                        value={contactInfo}
                                        onChange={(e) => setContactInfo(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preferences</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Special preferences (e.g., vegetarian meal)"
                                        value={preferences}
                                        onChange={(e) => setPreferences(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Restrictions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Dietary restrictions or seating constraints"
                                        value={restrictions}
                                        onChange={(e) => setRestrictions(e.target.value)}
                                    />
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={closeAddModal}>Cancel</Button>
                                <Button variant="primary" type="submit">Add Guest</Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>

                    {/* Edit Guest Modal */}
                    <Modal show={showEditModal} onHide={closeEditModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit Guest</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleEditGuest}>
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter guest name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contact Information</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Phone number or email"
                                        value={contactInfo}
                                        onChange={(e) => setContactInfo(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preferences</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Special preferences (e.g., vegetarian meal)"
                                        value={preferences}
                                        onChange={(e) => setPreferences(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Restrictions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Dietary restrictions or seating constraints"
                                        value={restrictions}
                                        onChange={(e) => setRestrictions(e.target.value)}
                                    />
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
                                <Button variant="primary" type="submit">Save Changes</Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </>
            )}
        </Container>
    );
};

export default GuestManagementPage;
