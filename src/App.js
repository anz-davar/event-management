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
import PublicGuestRegistrationPage from './pages/PublicGuestRegistrationPage';

// Auth context
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public guest registration routes without navbar */}
          <Route path="/event/:eventId/register" element={<PublicGuestRegistrationPage />} />
          <Route path="/register/:eventId" element={<PublicGuestRegistrationPage />} />
          
          {/* All other routes with navbar */}
          <Route path="/" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <HomePage />
              </Container>
            </>
          } />
          
          <Route path="/login" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <LoginPage />
              </Container>
            </>
          } />
          
          <Route path="/register" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <RegisterPage />
              </Container>
            </>
          } />
          
          <Route path="/events" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/create-event" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/halls" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <HallSelectionPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/tables/:eventId" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <TableManagementPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/guests/:eventId" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <GuestManagementPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/seating/:eventId" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute>
                  <SeatingArrangementPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          <Route path="/users" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <ProtectedRoute adminOnly={true}>
                  <UserManagementPage />
                </ProtectedRoute>
              </Container>
            </>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <>
              <Navbar />
              <Container className="mt-4">
                <Navigate to="/" />
              </Container>
            </>
          } />
        </Routes>
        </Router>
      </AuthProvider>
  );
}

export default App;
