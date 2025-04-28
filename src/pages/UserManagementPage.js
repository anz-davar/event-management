import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Modal } from 'react-bootstrap';
import axios from 'axios';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        Username: '',
        Email: '',
        Password: '',
        Role: 'User'
    });

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/users');
            setUsers(response.data);
            setError('');
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser({ ...currentUser, [name]: value });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/users/register', currentUser);
            setSuccess('User added successfully');
            setShowAddModal(false);
            setCurrentUser({
                Username: '',
                Email: '',
                Password: '',
                Role: 'User'
            });
            fetchUsers();
        } catch (error) {
            console.error('Error adding user:', error);
            setError('Failed to add user');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/users/${currentUser.UserID}`, currentUser);
            setSuccess('User updated successfully');
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`/api/users/${userId}`);
                setSuccess('User deleted successfully');
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setError('Failed to delete user');
            }
        }
    };

    const openEditModal = (user) => {
        // Clone the user object but remove password for security
        const userForEdit = { ...user, Password: '' };
        setCurrentUser(userForEdit);
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
                            <h2>User Management</h2>
                        </Col>
                        <Col className="text-end">
                            <Button variant="primary" onClick={() => setShowAddModal(true)}>
                                Add New User
                            </Button>
                        </Col>
                    </Row>

                    {users.length === 0 ? (
                        <Alert variant="info">No users have been added yet.</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map(user => (
                                <tr key={user.UserID}>
                                    <td>{user.UserID}</td>
                                    <td>{user.Username}</td>
                                    <td>{user.Email}</td>
                                    <td>{user.Role}</td>
                                    <td>{new Date(user.CreatedAt).toLocaleDateString()}</td>
                                    <td>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => openEditModal(user)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteUser(user.UserID)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}

                    {/* Add User Modal */}
                    <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add New User</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={handleAddUser}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Username"
                                        value={currentUser.Username}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="Email"
                                        value={currentUser.Email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="Password"
                                        value={currentUser.Password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        name="Role"
                                        value={currentUser.Role}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Event Manager">Event Manager</option>
                                        <option value="User">User</option>
                                    </Form.Select>
                                </Form.Group>
                                <div className="d-flex justify-content-end">
                                    <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Add User
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>

                    {/* Edit User Modal */}
                    <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Edit User</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={handleEditUser}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Username"
                                        value={currentUser.Username}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="Email"
                                        value={currentUser.Email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="Password"
                                        value={currentUser.Password}
                                        onChange={handleInputChange}
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank to keep current password
                                    </Form.Text>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Select
                                        name="Role"
                                        value={currentUser.Role}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Event Manager">Event Manager</option>
                                        <option value="User">User</option>
                                    </Form.Select>
                                </Form.Group>
                                <div className="d-flex justify-content-end">
                                    <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Update User
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

export default UserManagementPage;
