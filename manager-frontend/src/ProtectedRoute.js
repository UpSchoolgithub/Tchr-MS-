import React from 'react';
import { Navigate } from 'react-router-dom';
import { useManagerAuth } from './context/ManagerAuthContext';

const ProtectedRoute = ({ element }) => {
  const { token } = useManagerAuth();

  return token ? <Navigate to="/dashboard" /> : <Navigate to="/mlogin" />;
};

export default ProtectedRoute;
