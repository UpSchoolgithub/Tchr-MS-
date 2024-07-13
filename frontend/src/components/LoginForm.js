import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const LoginForm = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setError('');
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('An error occurred');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>WELCOME TO UpSchool</h2>
        <p>Join our community and learn new things everyday.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">LOGIN</button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="signup">Don't have an account? <a href="/signup">Sign up</a></p>
      </div>
    </div>
  );
};

export default LoginForm;
