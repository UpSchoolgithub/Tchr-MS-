import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateManager.css';

const Manager = () => {
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('https://tms.up.school/api/managers');
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };

  const handleEdit = (manager) => {
    // Handle edit logic
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        await axios.delete(`https://tms.up.school/api/managers/${id}`);
        fetchManagers(); // Refresh the list of managers
      } catch (error) {
        console.error('Error deleting manager:', error.message);
      }
    }
  };

  return (
    <div className="manager-container">
      <div className="manager-list">
        <h2>Managers</h2>
        <button className="save-button">Create Manager</button>
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
                  <button className="edit" onClick={() => handleEdit(manager)}>Edit</button>
                  <button className="delete" onClick={() => handleDelete(manager.id)}>Delete</button>
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
