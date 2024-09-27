import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';  // Adjust the path if necessary

const ProtectedRoute = ({ element: Component, ...rest }) => {
  const { manager } = useManagerAuth();

  return (
    <Route
      {...rest}
      render={(props) =>
        manager ? <Component {...props} /> : <Navigate to="/login" />
      }
    />
  );
};

export default ProtectedRoute;
