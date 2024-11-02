import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://tms.up.school/api',  // Ensure this is the correct base URL for your API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to request headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');  // Ensure this matches your token key
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Token sent with request:", token);  // Add this line to log the token
  } else {
    console.log("No token found");
  }
  return config;
});

export default axiosInstance;
