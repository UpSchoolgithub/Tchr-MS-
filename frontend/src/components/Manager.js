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
    try {
      const token = localStorage.getItem('token');  // Assuming the token is stored in localStorage
      if (!token) {
        console.error('No token found, please log in.');
        return;
      }
  
      // Make the request to the API with Authorization header
      const response = await axios.get('https://tms.up.school/api/managers', {
        headers: {
          Authorization: `Bearer ${token}`  // Add the token in the Authorization header
        }
      });
  
      console.log('Fetched Managers:', response.data);  // Display managers for debugging
      setManagers(response.data);  // Assuming setManagers is defined to update your state
    } catch (error) {
      console.error('Error fetching managers:', error.message);
  
      // Handle token expiration error
      if (error.response && error.response.status === 401) {
        if (error.response.data.expired) {
          alert('Your session has expired. Please log in again.');
          // Redirect to login page or prompt user to reauthenticate
          // navigate('/login');  // Assuming you're using a router to navigate
        }
      }
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
