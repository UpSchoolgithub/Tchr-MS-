import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // Ensure token is correctly stored
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Token sent with request:", token);  // Log token for verification
  } else {
    console.error("No token found in localStorage");
  }
  return config;
});

export default axiosInstance;
