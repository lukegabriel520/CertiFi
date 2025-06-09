import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BackendProvider } from './contexts/BackendContext';
import './App.css';

import LandingPage from './Pages/Landing Page/Landing';
import LoginPage from './Auth/Login Page/Login';
import SignupPage from './Auth/Signup Page/Signup';
import Dashboard from './Pages/Dashboard Page/Dashboard';

// Get the canister ID from environment variables or use a default for development
const canisterId = process.env.REACT_APP_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Add a proper loading spinner here
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const App = () => {
  return (
    <BackendProvider canisterId={canisterId}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/contact" element={<LandingPage />} />
          <Route path="/forgot-password" element={<LoginPage />} />
          <Route 
            path="/dashboard/:role" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BackendProvider>
  );
};

export default App;
