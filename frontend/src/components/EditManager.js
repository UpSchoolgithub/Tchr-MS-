import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditManager.css';

const EditManager = () => {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    schoolIds: []
  });
  const [schools, setSchools] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchManagerDetails();
    fetchSchools();
  }, [managerId]);

  const fetchManagerDetails = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/managers/${managerId}`);
      const managerData = response.data;
      setFormData({
        name: managerData.name,
        email: managerData.email,
        phoneNumber: managerData.phoneNumber,
        schoolIds: managerData.Schools.map(school => school.id) // Assuming Schools is an array of associated schools
      });
    } catch (error) {
      console.error('Error fetching manager details:', error.message);
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
    try {
      await axios.put(`https://tms.up.school/api/managers/${managerId}`, formData);
      navigate('/managers'); // Redirect back to manager list after update
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.errors.join(', '));
      } else {
        console.error('Error updating manager account:', error.message);
        setErrorMessage('An error occurred while updating the manager account.');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        await axios.delete(`https://tms.up.school/api/managers/${managerId}`);
        navigate('/managers'); // Redirect back to manager list after deletion
      } catch (error) {
        console.error('Error deleting manager:', error.message);
      }
    }
  };

  return (
    <div className="edit-manager-container">
      <h2>Edit Manager Account</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleFormSubmit}>
        <div>
          <label>Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
        </div>
        <div>
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
        <button type="submit" className="save-button">Update Manager</button>
        <button type="button" className="delete-button" onClick={handleDelete}>Delete Manager</button>
      </form>
    </div>
  );
};

export default EditManager;
