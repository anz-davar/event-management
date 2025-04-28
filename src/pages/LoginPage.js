import React, { useState, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!username || !password) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        const result = await login(username, password);

        if (result.success) {
            navigate('/events');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                <Card style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', padding: 0 }}>
                    <Card.Body style={{ padding: '40px 32px' }}>
                        <h2 style={{ textAlign: 'center', fontWeight: 700, marginBottom: 28 }}>Login</h2>
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
                            <Form.Group className="mb-4" controlId="formPassword">
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
                            <div className="d-grid gap-2">
                                <Button
                                    variant="success"
                                    type="submit"
                                    disabled={loading}
                                    style={{ borderRadius: 20, fontWeight: 600, fontSize: 18, padding: '10px 0' }}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </div>
                        </Form>
                        <div className="text-center mt-4">
                            <span style={{ fontWeight: 500 }}>Don't have an account? </span>
                            <Link to="/register" style={{ fontWeight: 700, color: '#2d7af6' }}>Register</Link>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
