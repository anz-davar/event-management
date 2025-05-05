import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Table } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

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
    const [needsAccessibleTable, setNeedsAccessibleTable] = useState(false);
    const [success, setSuccess] = useState('');

    // Socket.io connection
    const [socket, setSocket] = useState(null);

    // Set up socket connection
    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        // Join event room
        if (eventId) {
            newSocket.emit('joinEvent', eventId);
        }

        // Clean up on unmount
        return () => {
            newSocket.disconnect();
        };
    }, [eventId]);

    // Listen for new guest registrations
    useEffect(() => {
        if (!socket) return;

        // Handler for new guest registration
        const handleGuestRegistered = (data) => {
            if (data.event.EventID === parseInt(eventId)) {
                toast.success(`New guest registered: ${data.guest.FullName}`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                // Refresh the guest list
                fetchEventAndGuests();
            }
        };

        // Handler for new family registration
        const handleFamilyRegistered = (data) => {
            if (data.event.EventID === parseInt(eventId)) {
                toast.success(`New family registered: ${data.count} members`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                // Refresh the guest list
                fetchEventAndGuests();
            }
        };

        // Register event handlers
        socket.on('guestRegistered', handleGuestRegistered);
        socket.on('familyRegistered', handleFamilyRegistered);

        // Clean up on unmount or when socket changes
        return () => {
            socket.off('guestRegistered', handleGuestRegistered);
            socket.off('familyRegistered', handleFamilyRegistered);
        };
    }, [socket, eventId]);

    // Fetch event and guests data on component mount
    useEffect(() => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        fetchEventAndGuests();
    }, [eventId]);

    // Function to fetch event and guests data
    const fetchEventAndGuests = async () => {
        try {
            setLoading(true);
            const eventResponse = await axios.get(`/api/events/${eventId}`);
            setEvent(eventResponse.data.data || null);

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

    // Handle adding a new guest
    const handleAddGuest = async (e) => {
        e.preventDefault();
        try {
            const guestData = {
                EventID: parseInt(eventId),
                FullName: fullName,
                ContactInfo: contactInfo,
                Preferences: preferences,
                Restrictions: restrictions,
                NeedsAccessibleTable: needsAccessibleTable ? 1 : 0
            };
            const response = await axios.post('/api/guests', guestData);
            if (response.data.success) {
                setSuccess('Guest added successfully');
                closeAddModal();
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
                Restrictions: restrictions,
                NeedsAccessibleTable: needsAccessibleTable ? 1 : 0
            };
            const response = await axios.put('/api/guests', guestData);
            if (response.data.success) {
                setSuccess('Guest updated successfully');
                closeEditModal();
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
        setNeedsAccessibleTable(false);
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
        setNeedsAccessibleTable(guest.NeedsAccessibleTable === 1);
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

    // Copy public registration link to clipboard
    const copyRegistrationLink = () => {
        const registrationLink = `${window.location.origin}/register/${eventId}`;
        navigator.clipboard.writeText(registrationLink)
            .then(() => {
                toast.info('Registration link copied to clipboard!', {
                    position: "top-right",
                    autoClose: 3000,
                });
            })
            .catch(err => {
                console.error('Failed to copy link: ', err);
                setError('Failed to copy link to clipboard');
            });
    };

    return (
        <div>
            <ToastContainer />
            <Container className="mt-4">
                <h1>Guest Management</h1>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <Card className="mb-4">
                            <Card.Body>
                                <h2>{event?.EventName}</h2>
                                <p><strong>Date:</strong> {new Date(event?.EventDate).toLocaleDateString()}</p>
                                <p><strong>Total Guests:</strong> {guests.length}</p>
                            </Card.Body>
                        </Card>

                        <Row className="mb-4">
                            <Col>
                                <Button variant="primary" onClick={openAddModal} className="me-2">
                                    Add Guest
                                </Button>
                                <Button variant="info" onClick={copyRegistrationLink} className="me-2">
                                    <i className="bi bi-link"></i> Copy Registration Link
                                </Button>
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
                                    <th>Wheelchair Access</th>
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
                                        <td>{guest.NeedsAccessibleTable === 1 ? 'Yes' : 'No'}</td>
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
                                        <Form.Select
                                            value={restrictions}
                                            onChange={(e) => setRestrictions(e.target.value)}
                                        >
                                            <option value="">Select a restriction</option>
                                            <option value="near stage">Near Stage</option>
                                            <option value="center">Center</option>
                                            <option value="front">Front</option>
                                            <option value="back">Back</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Needs Wheelchair Accessible Table"
                                            checked={needsAccessibleTable}
                                            onChange={(e) => setNeedsAccessibleTable(e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Check this if the guest needs to be seated at a wheelchair accessible table
                                        </Form.Text>
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
                                        <Form.Select
                                            value={restrictions}
                                            onChange={(e) => setRestrictions(e.target.value)}
                                        >
                                            <option value="">Select a restriction</option>
                                            <option value="near stage">Near Stage</option>
                                            <option value="center">Center</option>
                                            <option value="front">Front</option>
                                            <option value="back">Back</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Needs Wheelchair Accessible Table"
                                            checked={needsAccessibleTable}
                                            onChange={(e) => setNeedsAccessibleTable(e.target.checked)}
                                        />
                                        <Form.Text className="text-muted">
                                            Check this if the guest needs to be seated at a wheelchair accessible table
                                        </Form.Text>
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
        </div>
    );
};

export default GuestManagementPage;
