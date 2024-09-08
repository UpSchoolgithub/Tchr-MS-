import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';
import axiosInstance from '../axiosInstance'; // Import your axios instance
import './MLoginForm.css';

const MLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthToken } = useManagerAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/manager/auth/login', {
        email,
        password,
      });

      const { token } = response.data;
      setAuthToken(token); // Store token in context
      localStorage.setItem('token', token); // Store token in localStorage
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);

      if (error.response && error.response.status === 401) {
        setError('Invalid credentials. Please try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2>Manager Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default MLoginForm;
