import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api',  // Update this to your production backend URL
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
