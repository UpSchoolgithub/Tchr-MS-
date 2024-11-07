import React, { useEffect } from 'react';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { token, teacherId, logout } = useTeacherAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      console.log("Teacher ID:", teacherId); // Debug to ensure teacherId is present
    }
  }, [token, teacherId, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!teacherId) return <p>Loading...</p>; // Optionally show a loading state

  return (
    <div>
      <h2>Teacher Dashboard</h2>
      <p>Welcome, Teacher {teacherId}</p> {/* Display teacher ID or name */}
      <button onClick={handleLogout}>Logout</button>
      {/* Add more dashboard features here */}
    </div>
  );
};

export default Dashboard;
