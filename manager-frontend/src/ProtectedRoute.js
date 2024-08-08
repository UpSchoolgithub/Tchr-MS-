// src/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useManagerAuth } from './context/ManagerAuthContext';

const ProtectedRoute = ({ element }) => {
  const { token } = useManagerAuth();
  const location = useLocation();

  // If there's no token, redirect to login with the state of the current path
  return token ? element : <Navigate to="/dashboard" state={{ from: location }} replace />;
};

export default ProtectedRoute;
