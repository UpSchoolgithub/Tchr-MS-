// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        console.log('Decoded Token:', decodedToken); // Log the decoded token
        if (decodedToken.id) {
          setUserId(decodedToken.id);
          setToken(storedToken);
        } else {
          console.error('User ID not found in token');
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
        setUserId(decodedToken.id);
        setToken(newToken);
        localStorage.setItem('token', newToken);
      } else {
        console.error('User ID not found in token');
      }
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, token, setAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};
