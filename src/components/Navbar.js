import React, { useContext } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavBar = () => {
    const { user, logout, isAdmin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">Smart Event Manager</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        {user && (
                            <>
                                <Nav.Link as={Link} to="/events">My Events</Nav.Link>
                                {/*<Nav.Link as={Link} to="/create-event">Create Event</Nav.Link>*/}
                                <Nav.Link as={Link} to="/halls">Halls</Nav.Link>
                            </>
                        )}
                        {user && isAdmin() && (
                            <Nav.Link as={Link} to="/users">User Management</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Signed in as: {user.Username || user.username}
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                {/*<Nav.Link as={Link} to="/login">Login</Nav.Link>*/}
                                {/*<Nav.Link as={Link} to="/register">Register</Nav.Link>*/}
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavBar;
