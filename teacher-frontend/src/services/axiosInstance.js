import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api', // Updated to match your backend URL
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
