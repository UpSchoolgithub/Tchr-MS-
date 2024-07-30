import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.error('No refresh token available. Please log in again.');
          return Promise.reject(error);
        }

        const response = await axios.post('http://localhost:5000/api/manager/auth/refresh-token', {
          refreshToken,
        });

        const newToken = response.data.token;
        
        // Save the new token
        localStorage.setItem('token', newToken);

        // Update the Authorization header
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (err) {
        console.error('Failed to refresh token:', err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
