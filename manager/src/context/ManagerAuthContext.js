import React, { createContext, useState, useEffect } from 'react';
import axios from './axiosInstance';  // Shared axios instance

export const ManagerAuthContext = createContext();

export const ManagerAuthProvider = ({ children }) => {
  const [manager, setManager] = useState(null);

  useEffect(() => {
    const savedManager = localStorage.getItem('manager');
    if (savedManager) {
      setManager(JSON.parse(savedManager));
    }
  }, []);

  const managerLogin = async (credentials) => {
    const response = await axios.post('/manager/login', credentials);
    setManager(response.data);
    localStorage.setItem('manager', JSON.stringify(response.data));
  };

  const managerLogout = () => {
    setManager(null);
    localStorage.removeItem('manager');
  };

  return (
    <ManagerAuthContext.Provider value={{ manager, managerLogin, managerLogout }}>
      {children}
    </ManagerAuthContext.Provider>
  );
};
