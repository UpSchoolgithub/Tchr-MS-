import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api',  // Ensure this is the correct base URL for your API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to request headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');  // Make sure this key matches the one you used in TeacherList.js
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
