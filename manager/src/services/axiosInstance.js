import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization Header:", config.headers.Authorization);
  } else {
    console.error("No token found in localStorage");
  }
  return config;
});

export default axiosInstance;
