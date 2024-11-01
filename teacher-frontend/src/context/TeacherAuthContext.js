import React, { createContext, useState, useContext, useEffect } from 'react';
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
  const [teacherId, setTeacherId] = useState(localStorage.getItem('teacherId') || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    // Sync state with localStorage in case of any changes
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    if (teacherId) {
      localStorage.setItem('teacherId', teacherId);
    } else {
      localStorage.removeItem('teacherId');
    }
  }, [token, teacherId]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/teacher/login', { email, password });
      const { token, teacherId } = response.data;
      setToken(token);
      setTeacherId(teacherId);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setTeacherId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('teacherId');
  };

  return (
    <TeacherAuthContext.Provider value={{ teacherId, token, login, logout }}>
      {children}
    </TeacherAuthContext.Provider>
  );
};

export default TeacherAuthProvider;
