// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useManagerAuth } from './context/ManagerAuthContext';

const ProtectedRoute = ({ element }) => {
  const { token } = useManagerAuth();
  return token ? element : <Navigate to="/dashboard" />;
};

export default ProtectedRoute;
