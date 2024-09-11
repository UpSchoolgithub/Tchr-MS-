// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useManagerAuth } from './context/ManagerAuthContext';

const ProtectedRoute = ({ element }) => {
  const { token } = useManagerAuth();

  console.log("Token inside ProtectedRoute:", token);  // Add this log to check token
  console.log("Element inside ProtectedRoute:", element);  // Add this log to check element

  return token ? element : <Navigate to="/mlogin" />;
};


export default ProtectedRoute;
