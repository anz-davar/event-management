import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading, isAdmin } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="d-flex justify-content-center mt-5">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
