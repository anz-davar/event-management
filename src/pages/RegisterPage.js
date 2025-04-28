import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await register(username, email, password);

        if (result.success) {
            navigate('/login');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <Container style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Row className="w-100">
                <Col md={{ span: 6, offset: 3 }}>
                    <Card style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>
                        <Card.Body style={{ padding: '40px 32px' }}>
                            <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 28 }}>Register</h2>
                            {error && <Alert variant="danger" style={{ fontWeight: 500, textAlign: 'center' }}>{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label style={{ fontWeight: 500 }}>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        style={{ borderRadius: 16, fontSize: 16, padding: '10px 14px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formEmail">
                                    <Form.Label style={{ fontWeight: 500 }}>Email address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ borderRadius: 16, fontSize: 16, padding: '10px 14px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formPassword">
                                    <Form.Label style={{ fontWeight: 500 }}>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ borderRadius: 16, fontSize: 16, padding: '10px 14px' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formConfirmPassword">
                                    <Form.Label style={{ fontWeight: 500 }}>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ borderRadius: 16, fontSize: 16, padding: '10px 14px' }}
                                    />
                                </Form.Group>

                                <div className="d-grid gap-2">
                                    <Button variant="success" type="submit" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register'}
                                    </Button>
                                </div>
                            </Form>

                            <div className="text-center mt-3">
                                <p>
                                    Already have an account? <Link to="/login">Login</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RegisterPage;
