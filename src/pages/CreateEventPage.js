import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CreateEventPage = () => {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [maxGuests, setMaxGuests] = useState('');
    const [hallId, setHallId] = useState('');
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const locationHook = useLocation();

    // Auto-select hall from URL param
    useEffect(() => {
        const params = new URLSearchParams(locationHook.search);
        const hallIdParam = params.get('hallId');
        if (hallIdParam) {
            setHallId(hallIdParam);
        }
    }, [locationHook.search]);

    useEffect(() => {
        fetchHalls();
    }, []);

    const fetchHalls = async () => {
        try {
            const response = await axios.get('/api/halls');
            setHalls(Array.isArray(response.data.halls) ? response.data.halls : response.data.data.halls || []);
        } catch (error) {
            console.error('Error fetching halls:', error);
            setError('Failed to load venue halls');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get the user from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            const parsedHallId = parseInt(hallId, 10);

            if (!parsedHallId || isNaN(parsedHallId)) {
                setError('Please select a valid hall.');
                setLoading(false);
                return;
            }

            const eventData = {
                UserID: user && user.UserID,
                EventName: eventName,
                EventDate: eventDate,
                Location: location,
                MaxGuests: parseInt(maxGuests, 10),
                HallID: parsedHallId,
            };

            const response = await axios.post('/api/events', eventData);

            if (response.data) {
                navigate('/events');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            setError('Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h2>Create New Event</h2>
                        </Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="eventName">
                                    <Form.Label>Event Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter event name"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="eventDate">
                                    <Form.Label>Event Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="location">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="maxGuests">
                                    <Form.Label>Maximum Number of Guests</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter max guests"
                                        value={maxGuests}
                                        onChange={(e) => setMaxGuests(e.target.value)}
                                        required
                                        min="1"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="hallId">
                                    <Form.Label>Select Hall</Form.Label>
                                    <Form.Select
                                        value={hallId}
                                        onChange={(e) => setHallId(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose a hall...</option>
                                        {halls.map(hall => (
                                            <option key={hall.HallID} value={hall.HallID}>
                                                {hall.HallName} (Capacity: {hall.MaxCapacity})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating...' : 'Create Event'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateEventPage;
