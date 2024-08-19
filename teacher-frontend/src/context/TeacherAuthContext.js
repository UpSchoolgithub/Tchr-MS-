import React, { createContext, useState, useContext } from 'react';
import axiosInstance from '../services/axiosInstance';

const TeacherAuthContext = createContext();

export const useTeacherAuth = () => {
  return useContext(TeacherAuthContext);
};

const TeacherAuthProvider = ({ children }) => {
  const [teacherId, setTeacherId] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/teacher/login', { email, password });
      setToken(response.data.token);
      setTeacherId(response.data.teacherId);
      localStorage.setItem('token', response.data.token);
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
