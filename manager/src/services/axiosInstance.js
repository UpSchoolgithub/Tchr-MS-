import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',  // Update the baseURL to your backend server
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add request/response interceptors for token handling
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
