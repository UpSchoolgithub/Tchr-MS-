import React, { createContext, useContext, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

const TeacherAuthContext = createContext();

export const useTeacherAuth = () => useContext(TeacherAuthContext);

const TeacherAuthProvider = ({ children }) => {
  const [teacherId, setTeacherId] = useState(localStorage.getItem('teacherId') || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/teacher/login', { email, password });
      const { teacherId, token } = response.data;  // Ensure `token` is part of response.data
      setTeacherId(teacherId);
      setToken(token);
      localStorage.setItem('teacherId', teacherId);
      localStorage.setItem('token', token);
      console.log('Token received:', token); // Log token for verification
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
