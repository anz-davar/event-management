import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/events');
            setEvents(response.data.data || []);
            setError('');
        } catch (error) {
            setError('Failed to load events');
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                const response = await axios.delete(`/api/events/${eventId}`);
                if (response.data.success) {
                    fetchEvents();
                } else {
                    setError(response.data.error || 'Failed to delete event');
                }
            } catch (error) {
                setError('Failed to delete event');
                console.error('Error deleting event:', error);
            }
        }
    };

    return (
        <Container>
            <Row className="mb-4">
                <Col>
                    <h2>My Events</h2>
                </Col>
                <Col className="text-end">
                    <Link to="/create-event">
                        <Button variant="primary">Create New Event</Button>
                    </Link>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : events.length === 0 ? (
                <Card className="text-center p-5">
                    <Card.Body>
                        <h3>No events found</h3>
                        <p>Create your first event to get started</p>
                        <Link to="/create-event">
                            <Button variant="primary">Create Event</Button>
                        </Link>
                    </Card.Body>
                </Card>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Max Guests</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {events.map(event => (
                        <tr key={event.EventID}>
                            <td>{event.EventName}</td>
                            <td>{new Date(event.EventDate).toLocaleDateString()}</td>
                            <td>{event.location}</td>
                            <td>{event.MaxGuests}</td>
                            <td>
                                <div className="d-flex gap-2">
                                    <Link to={`/guests/${event.EventID}`}>
                                        <Button variant="outline-primary" size="sm">Guests</Button>
                                    </Link>
                                    <Link to={`/tables/${event.EventID}`}>
                                        <Button variant="outline-success" size="sm">Tables</Button>
                                    </Link>
                                    <Link to={`/seating/${event.EventID}`}>
                                        <Button variant="outline-info" size="sm">Seating</Button>
                                    </Link>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDeleteEvent(event.EventID)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default EventsPage;
