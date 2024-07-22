// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Named import

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [managerId, setManagerId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        console.log("Decoded Token:", decoded); // Log the entire decoded token
        if (decoded.managerId) {
          setManagerId(decoded.managerId);
        } else {
          console.error("Manager ID not found in token");
        }
        setToken(storedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    } else {
      console.log("No token found in localStorage");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ managerId, token }}>
      {children}
    </AuthContext.Provider>
  );
};
