import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const isTokenValid = (decodedToken) => {
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        console.log('Decoded Token:', decodedToken);
        if (decodedToken.id && isTokenValid(decodedToken)) {
          setUserId(decodedToken.id);
          setToken(storedToken);
        } else {
          console.error('Token is invalid or expired');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const setAuthToken = (newToken) => {
    try {
      const decodedToken = jwtDecode(newToken);
      console.log('Decoded Token:', decodedToken);
      if (decodedToken.id && isTokenValid(decodedToken)) {
        setUserId(decodedToken.id);
        setToken(newToken);
        localStorage.setItem('token', newToken);
      } else {
        console.error('Token is invalid or expired');
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
