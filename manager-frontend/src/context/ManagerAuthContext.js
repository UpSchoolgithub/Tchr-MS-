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
      const decodedToken = jwtDecode(storedToken);
      setManagerId(decodedToken.id);
      setToken(storedToken);
    }
  }, []);

  const setAuthToken = (newToken) => {
    const decodedToken = jwtDecode(newToken);
    setManagerId(decodedToken.id);
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  return (
    <ManagerAuthContext.Provider value={{ managerId, token, setAuthToken }}>
      {children}
    </ManagerAuthContext.Provider>
  );
};
