import React, { useEffect } from 'react';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { token, logout } = useTeacherAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h2>Teacher Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
      {/* Add more dashboard features here */}
    </div>
  );
};

export default Dashboard;
