import React, { createContext, useState, useEffect } from 'react';

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
    try {
      const response = await fetch('/manager/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setManager(data);
      localStorage.setItem('manager', JSON.stringify(data));
    } catch (error) {
      console.error('Error during manager login:', error);
    }
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
