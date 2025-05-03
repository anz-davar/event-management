import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const PublicGuestRegistrationPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // States for event data
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // States for guest form
    const [fullName, setFullName] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [preferences, setPreferences] = useState('');
    const [restrictions, setRestrictions] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Fetch event details on component mount
    useEffect(() => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        const fetchEvent = async () => {
            try {
                setLoading(true);
                // Fetch event details using the public endpoint
                const eventResponse = await axios.get(`/api/events/public/${eventId}`);
                setEvent(eventResponse.data.data);
                setError('');
            } catch (error) {
                console.error('Error fetching event:', error);
                setError('Failed to load event data or event does not exist');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
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

            const response = await axios.post('/api/guests/public', guestData);
            if (response.data.success) {
                setSuccess('Thank you for registering! Your registration has been confirmed.');
                setSubmitted(true);
                // Reset form
                setFullName('');
                setContactInfo('');
                setPreferences('');
                setRestrictions('');
            } else {
                setError(response.data.error || 'Failed to register');
            }
        } catch (error) {
            console.error('Error registering:', error);
            setError('Failed to register. Please try again later.');
        }
    };

    // Render a thank you message after successful submission
    const renderThankYou = () => (
        <Card className="text-center p-5 my-5">
            <Card.Body>
                <h2 className="text-success mb-4">Registration Confirmed!</h2>
                <p className="mb-4">Thank you for registering for {event?.EventName}.</p>
                <p className="mb-4">We look forward to seeing you on {new Date(event?.EventDate).toLocaleDateString()}.</p>
                <Button variant="primary" onClick={() => setSubmitted(false)}>Register Another Guest</Button>
            </Card.Body>
        </Card>
    );

    // Render the registration form
    const renderRegistrationForm = () => (
        <Card className="p-4 my-4">
            <Card.Body>
                <h3 className="mb-4">Register as a Guest</h3>
                <Form onSubmit={handleAddGuest}>
                    <Form.Group className="mb-3">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter your full name"
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
                        <Form.Text className="text-muted">
                            Enter any special preferences you have for the event.
                        </Form.Text>
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
                        <Form.Text className="text-muted">
                            Enter any dietary restrictions or seating constraints.
                        </Form.Text>
                    </Form.Group>
                    <div className="d-grid gap-2">
                        <Button variant="primary" type="submit" size="lg">
                            Register
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '40px 0'
        }}>
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

                        {event ? (
                            <>
                                <Card className="text-center p-4 mb-5">
                                    <Card.Body>
                                        <h1 className="display-4">{event.EventName}</h1>
                                        <p className="lead">
                                            <strong>Date:</strong> {new Date(event.EventDate).toLocaleDateString()}
                                        </p>
                                        {event.location && (
                                            <p className="lead">
                                                <strong>Location:</strong> {event.location}
                                            </p>
                                        )}
                                    </Card.Body>
                                </Card>

                                {submitted ? renderThankYou() : renderRegistrationForm()}
                            </>
                        ) : (
                            <Card className="text-center p-5 my-5">
                                <Card.Body>
                                    <h2>Event Not Found</h2>
                                    <p>The event you are looking for does not exist or has been removed.</p>
                                </Card.Body>
                            </Card>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default PublicGuestRegistrationPage;
