// TeacherAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const TeacherAuthContext = createContext();

export const useTeacherAuth = () => {
  return useContext(TeacherAuthContext);
};

const TeacherAuthProvider = ({ children }) => {
  const [teacherId, setTeacherId] = useState(localStorage.getItem('teacherId') || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    // Sync with local storage
    if (teacherId) localStorage.setItem('teacherId', teacherId);
    if (token) localStorage.setItem('token', token);
  }, [teacherId, token]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/teacher/login', { email, password });
      setTeacherId(response.data.teacherId);
      setToken(response.data.token);
      // Save to localStorage for persistence
      localStorage.setItem('teacherId', response.data.teacherId);
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      throw new Error(error.response ? error.response.data.message : 'Login failed');
    }
  };

  const logout = () => {
    setTeacherId(null);
    setToken(null);
    localStorage.removeItem('teacherId');
    localStorage.removeItem('token');
  };

  return (
    <TeacherAuthContext.Provider value={{ teacherId, token, login, logout }}>
      {children}
    </TeacherAuthContext.Provider>
  );
};

export default TeacherAuthProvider;
