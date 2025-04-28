import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import components
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import CreateEventPage from './pages/CreateEventPage';
import HallSelectionPage from './pages/HallSelectionPage';
import TableManagementPage from './pages/TableManagementPage';
import GuestManagementPage from './pages/GuestManagementPage';
import SeatingArrangementPage from './pages/SeatingArrangementPage';
import UserManagementPage from './pages/UserManagementPage';

// Auth context
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
      <AuthProvider>
        <Router>
          <Navbar />
          <Container className="mt-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <EventsPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/create-event"
                  element={
                    <ProtectedRoute>
                      <CreateEventPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/halls"
                  element={
                    <ProtectedRoute>
                      <HallSelectionPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/tables/:eventId"
                  element={
                    <ProtectedRoute>
                      <TableManagementPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/guests/:eventId"
                  element={
                    <ProtectedRoute>
                      <GuestManagementPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/seating/:eventId"
                  element={
                    <ProtectedRoute>
                      <SeatingArrangementPage />
                    </ProtectedRoute>
                  }
              />
              <Route
                  path="/users"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
  );
}

export default App;
