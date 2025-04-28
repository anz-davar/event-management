import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HallManagementPage = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentHall, setCurrentHall] = useState({
    HallName: '',
    MaxCapacity: 0,
    Location: '',
    EventType: ''
  });

  // Fetch halls on component mount
  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/halls');
      setHalls(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching halls:', error);
      setError('Failed to load halls');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentHall({ ...currentHall, [name]: name === 'MaxCapacity' ? parseInt(value) : value });
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/halls', currentHall);
      setSuccess('Hall added successfully');
      setShowAddModal(false);
      setCurrentHall({
        HallName: '',
        MaxCapacity: 0,
        Location: '',
        EventType: ''
      });
      fetchHalls();
    } catch (error) {
      console.error('Error adding hall:', error);
      setError('Failed to add hall');
    }
  };

  const handleEditHall = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/halls', currentHall);
      setSuccess('Hall updated successfully');
      setShowEditModal(false);
      fetchHalls();
    } catch (error) {
      console.error('Error updating hall:', error);
      setError('Failed to update hall');
    }
  };

  const handleDeleteHall = async (hallId) => {
    if (window.confirm('Are you sure you want to delete this hall?')) {
      try {
        await axios.delete(`/api/halls/${hallId}`);
        setSuccess('Hall deleted successfully');
        fetchHalls();
      } catch (error) {
        console.error('Error deleting hall:', error);
        setError('Failed to delete hall');
      }
    }
  };

  const openEditModal = (hall) => {
    setCurrentHall(hall);
    setShowEditModal(true);
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
          
          <Row className="mb-4">
            <Col>
              <h2>Hall Management</h2>
            </Col>
            <Col className="text-end">
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Add New Hall
              </Button>
            </Col>
          </Row>
          
          {halls.length === 0 ? (
            <Alert variant="info">No halls have been added yet.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hall Name</th>
                  <th>Max Capacity</th>
                  <th>Location</th>
                  <th>Event Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {halls.map(hall => (
                  <tr key={hall.HallID}>
                    <td>{hall.HallID}</td>
                    <td>{hall.HallName}</td>
                    <td>{hall.MaxCapacity}</td>
                    <td>{hall.Location}</td>
                    <td>{hall.EventType}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(hall)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteHall(hall.HallID)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          {/* Add Hall Modal */}
          <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Add New Hall</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleAddHall}>
                <Form.Group className="mb-3">
                  <Form.Label>Hall Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="HallName" 
                    value={currentHall.HallName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Capacity</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="MaxCapacity" 
                    value={currentHall.MaxCapacity} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="Location" 
                    value={currentHall.Location} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Event Type</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="EventType" 
                    value={currentHall.EventType} 
                    onChange={handleInputChange} 
                    placeholder="Wedding, Conference, etc." 
                    required 
                  />
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Add Hall
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
          
          {/* Edit Hall Modal */}
          <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Hall</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleEditHall}>
                <Form.Group className="mb-3">
                  <Form.Label>Hall Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="HallName" 
                    value={currentHall.HallName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Capacity</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="MaxCapacity" 
                    value={currentHall.MaxCapacity} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="Location" 
                    value={currentHall.Location} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Event Type</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="EventType" 
                    value={currentHall.EventType} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                <div className="d-flex justify-content-end">
                  <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Update Hall
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </>
      )}
    </Container>
  );
};

export default HallManagementPage;