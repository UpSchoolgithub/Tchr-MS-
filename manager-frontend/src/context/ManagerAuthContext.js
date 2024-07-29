// src/context/ManagerAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const ManagerAuthContext = createContext();

export const useManagerAuth = () => useContext(ManagerAuthContext);

export const ManagerAuthProvider = ({ children }) => {
  const [managerId, setManagerId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        console.log('Decoded Token:', decodedToken); // Log the decoded token
        if (decodedToken.id) {
          setManagerId(decodedToken.id);
          setToken(storedToken);
        } else {
          console.error('Manager ID not found in token');
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, []);

  const setAuthToken = (newToken) => {
    try {
      const decodedToken = jwtDecode(newToken);
      console.log('Decoded Token:', decodedToken); // Log the decoded token
      if (decodedToken.id) {
        setManagerId(decodedToken.id);
        setToken(newToken);
        localStorage.setItem('token', newToken);
      } else {
        console.error('Manager ID not found in token');
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  return (
    <ManagerAuthContext.Provider value={{ managerId, token, setAuthToken }}>
      {children}
    </ManagerAuthContext.Provider>
  );
};
