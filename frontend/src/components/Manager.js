import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateManager.css';

const Manager = () => {
  const [managers, setManagers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [editingManager, setEditingManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    schoolIds: [],
  });

  useEffect(() => {
    fetchManagers();
    fetchSchools();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('https://tms.up.school/api/managers');
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await axios.get('https://tms.up.school/api/managers/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
    }
  };

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      phoneNumber: manager.phoneNumber,
      schoolIds: manager.Schools.map(school => school.id)
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSchoolChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setFormData(prevState => ({
        ...prevState,
        schoolIds: [...prevState.schoolIds, value]
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        schoolIds: prevState.schoolIds.filter(id => id !== value)
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (editingManager) {
      // Update existing manager
      try {
        await axios.put(`https://tms.up.school/api/managers/${editingManager.id}`, formData);
        fetchManagers(); // Refresh the list of managers
        setEditingManager(null);
        setFormData({ name: '', email: '', phoneNumber: '', schoolIds: [] });
      } catch (error) {
        console.error('Error updating manager:', error.message);
      }
    } else {
      // Create new manager
      try {
        await axios.post('https://tms.up.school/api/managers', formData);
        fetchManagers(); // Refresh the list of managers
        setFormData({ name: '', email: '', phoneNumber: '', schoolIds: [] });
      } catch (error) {
        console.error('Error creating manager:', error.message);
      }
    }
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

  const handleCancelEdit = () => {
    setEditingManager(null);
    setFormData({ name: '', email: '', phoneNumber: '', schoolIds: [] });
  };

  return (
    <div className="manager-container">
      <div className="manager-list">
        <h2>{editingManager ? 'Edit Manager' : 'Create Manager'}</h2>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Schools</label>
            <div className="school-checkboxes">
              {schools.map(school => (
                <div key={school.id}>
                  <input
                    type="checkbox"
                    value={school.id}
                    checked={formData.schoolIds.includes(school.id)}
                    onChange={handleSchoolChange}
                  />
                  <label>{school.name}</label>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="save-button">{editingManager ? 'Update' : 'Create'} Manager</button>
          {editingManager && (
            <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancel</button>
          )}
        </form>

        <h2>Managers</h2>
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
