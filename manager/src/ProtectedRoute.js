import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useManagerAuth from '../context/ManagerAuthContext';  // Ensure the path is correct

const ProtectedRoute = () => {
  const { manager } = useManagerAuth();

  return manager ? <Outlet /> : <Navigate to="/mlogin" />;
};

export default ProtectedRoute;
