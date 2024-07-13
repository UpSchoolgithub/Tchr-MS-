import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = ({ setToken }) => {
  const navigate = useNavigate();

  useEffect(() => {
    setToken(null);
    localStorage.removeItem('token');
    setTimeout(() => {
      navigate('/login');
    }, 3000); // Redirect to login page after 3 seconds
  }, [navigate, setToken]);

  return (
    <div>
      <h2>Thank you! See you back soon.</h2>
    </div>
  );
};

export default Logout;
