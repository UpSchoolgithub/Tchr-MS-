import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateManager.css';

const Manager = () => {
  const [managers, setManagers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    const token = localStorage.getItem('authToken');
    console.log('Token:', token); // Check if token is present
  
    if (!token) {
      console.error('No token found. Redirecting to login.');
      navigate('/login'); // Redirect to login if no token
      return;
    }
  
    try {
      const response = await axios.get('https://tms.up.school/api/managers', {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token in the request header
        },
      });
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };
  
  
  

  const handleEdit = (managerId) => {
    navigate(`/edit-manager/${managerId}`);  // Navigate to EditManager component with managerId
  };

  const handleDelete = async (id, schoolCount) => {
    const message = schoolCount > 0 
      ? 'This manager is tagged to a school. Are you sure you want to delete this manager?' 
      : 'Are you sure you want to delete this manager?';

    if (window.confirm(message)) {
      try {
        await axios.delete(`https://tms.up.school/api/managers/${id}`);
        fetchManagers(); // Refresh the list of managers
      } catch (error) {
        console.error('Error deleting manager:', error.message);
      }
    }
  };

  const handleCreateManager = () => {
    navigate('/create-manager');  // Navigate to CreateManager component
  };

  return (
    <div className="manager-container">
      <div className="manager-list">
        <h2>Managers</h2>
        <button className="save-button" onClick={handleCreateManager}>Create Manager</button>
        <table className="manager-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Schools</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.id}>
                <td>{manager.name}</td>
                <td>{manager.email}</td>
                <td>{manager.phoneNumber}</td>
                <td>{manager.Schools.map(school => school.name).join(', ')}</td>
                <td>
                  <button className="edit" onClick={() => handleEdit(manager.id)}>Edit</button>
                  <button className="delete" onClick={() => handleDelete(manager.id, manager.Schools.length)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Manager;
