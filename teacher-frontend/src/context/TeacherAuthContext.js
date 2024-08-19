import React, { createContext, useState, useContext } from 'react';
import axiosInstance from '../services/axiosInstance';

const TeacherAuthContext = createContext();

export const useTeacherAuth = () => {
  const context = useContext(TeacherAuthContext);
  if (!context) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return context;
};

const TeacherAuthProvider = ({ children }) => {
  const [teacherId, setTeacherId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/teacher/login', { email, password });
      const { token, teacherId } = response.data;
      setToken(token);
      setTeacherId(teacherId);
      localStorage.setItem('token', token); // Save token to localStorage
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setTeacherId(null);
    localStorage.removeItem('token');
  };

  return (
    <TeacherAuthContext.Provider value={{ teacherId, token, login, logout }}>
      {children}
    </TeacherAuthContext.Provider>
  );
};

export default TeacherAuthProvider;
