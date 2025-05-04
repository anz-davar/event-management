import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';

const PublicGuestRegistrationPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // States for event data
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // States for family registration
    const [contactInfo, setContactInfo] = useState('');
    const [familyMembers, setFamilyMembers] = useState([
        {
            id: 1,
            fullName: '',
            preferences: '',
            restrictions: '',
            needsAccessibleTable: false
        }
    ]);

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

    // Handle adding a new family member to the form
    const handleAddFamilyMember = () => {
        setFamilyMembers(prev => [
            ...prev,
            {
                id: Date.now(), // Use timestamp as unique ID
                fullName: '',
                preferences: '',
                restrictions: '',
                needsAccessibleTable: false
            }
        ]);
    };

    // Handle removing a family member from the form
    const handleRemoveFamilyMember = (id) => {
        if (familyMembers.length > 1) {
            setFamilyMembers(prev => prev.filter(member => member.id !== id));
        }
    };

    // Handle changes to a family member's data
    const handleFamilyMemberChange = (id, field, value) => {
        setFamilyMembers(prev => 
            prev.map(member => 
                member.id === id ? { ...member, [field]: value } : member
            )
        );
    };

    // Handle submitting the family registration
    const handleFamilyRegistration = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!contactInfo.trim()) {
            setError('Contact information is required');
            return;
        }

        // Check if all family members have names
        const emptyNames = familyMembers.filter(member => !member.fullName.trim());
        if (emptyNames.length > 0) {
            setError('All family members must have a name');
            return;
        }

        try {
            // Create an array of guest data objects for each family member
            const guestDataArray = familyMembers.map(member => ({
                EventID: parseInt(eventId),
                FullName: member.fullName,
                ContactInfo: contactInfo, // Shared contact info for all family members
                Preferences: member.preferences,
                Restrictions: member.restrictions,
                NeedsAccessibleTable: member.needsAccessibleTable ? 1 : 0, // Convert boolean to 1/0
                FamilyGroup: true // Mark as part of a family group
            }));

            // Submit all family members
            const response = await axios.post('/api/guests/public/family', guestDataArray);
            
            if (response.data.success) {
                setSuccess(`Thank you for registering your family! ${familyMembers.length} guests have been registered.`);
                setSubmitted(true);
                // Reset form
                setContactInfo('');
                setFamilyMembers([
                    {
                        id: 1,
                        fullName: '',
                        preferences: '',
                        restrictions: '',
                        needsAccessibleTable: false
                    }
                ]);
            } else {
                setError(response.data.error || 'Failed to register');
            }
        } catch (error) {
            console.error('Error registering family:', error);
            setError(error.response?.data?.error || 'Failed to register. Please try again later.');
        }
    };

    // Render a thank you message after successful submission
    const renderThankYou = () => (
        <Card className="text-center p-5 my-5">
            <Card.Body>
                <h2 className="text-success mb-4">Family Registration Confirmed!</h2>
                <p className="mb-4">Thank you for registering your family for {event?.EventName}.</p>
                <p className="mb-4">We look forward to seeing you on {new Date(event?.EventDate).toLocaleDateString()}.</p>
                <p className="mb-4">Your family members will be seated together at the same table.</p>
                <Button variant="primary" onClick={() => setSubmitted(false)}>Register Another Family</Button>
            </Card.Body>
        </Card>
    );

    // Render the registration form for family members
    const renderRegistrationForm = () => (
        <Card className="p-4 my-4">
            <Card.Body>
                <h3 className="mb-4">Family Registration</h3>
                <p className="text-muted mb-4">
                    Register multiple family members at once. Family members will be seated together at the same table.
                </p>
                
                <Form onSubmit={handleFamilyRegistration}>
                    {/* Shared contact information for all family members */}
                    <Form.Group className="mb-4">
                        <Form.Label><strong>Family Contact Information</strong></Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Phone number or email for the entire family"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            required
                        />
                        <Form.Text className="text-muted">
                            This contact information will be shared for all family members and used to group you together.
                        </Form.Text>
                    </Form.Group>
                    
                    <hr className="my-4" />
                    
                    <h4 className="mb-3">Family Members</h4>
                    
                    {/* Family members section */}
                    {familyMembers.map((member, index) => (
                        <div key={member.id} className="family-member-section p-3 mb-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Family Member {index + 1}</h5>
                                {familyMembers.length > 1 && (
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm" 
                                        onClick={() => handleRemoveFamilyMember(member.id)}
                                        aria-label="Remove family member"
                                    >
                                        <FaTrash /> Remove
                                    </Button>
                                )}
                            </div>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter full name"
                                    value={member.fullName}
                                    onChange={(e) => handleFamilyMemberChange(member.id, 'fullName', e.target.value)}
                                    required
                                />
                            </Form.Group>
                            
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Preferences</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Special preferences (e.g., vegetarian meal)"
                                            value={member.preferences}
                                            onChange={(e) => handleFamilyMemberChange(member.id, 'preferences', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Restrictions</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Dietary restrictions or seating constraints"
                                            value={member.restrictions}
                                            onChange={(e) => handleFamilyMemberChange(member.id, 'restrictions', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Needs Wheelchair Accessible Table"
                                    checked={member.needsAccessibleTable}
                                    onChange={(e) => handleFamilyMemberChange(member.id, 'needsAccessibleTable', e.target.checked)}
                                />
                                <Form.Text className="text-muted">
                                    Check this if this family member needs to be seated at a wheelchair accessible table
                                </Form.Text>
                            </Form.Group>
                        </div>
                    ))}
                    
                    {/* Add family member button */}
                    <div className="d-grid mb-4">
                        <Button 
                            variant="outline-primary" 
                            onClick={handleAddFamilyMember}
                            className="d-flex align-items-center justify-content-center gap-2"
                        >
                            <FaPlus /> Add Another Family Member
                        </Button>
                    </div>
                    
                    <div className="d-grid gap-2 mt-4">
                        <Button variant="primary" type="submit" size="lg">
                            Register Family ({familyMembers.length} {familyMembers.length === 1 ? 'person' : 'people'})
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
