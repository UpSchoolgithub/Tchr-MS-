import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditManager.css';

const EditManager = () => {
  const { managerId } = useParams();
  const navigate = useNavigate();
  const [managerData, setManagerData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    schoolIds: [],
  });
  const [schools, setSchools] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchManagerDetails();
    fetchSchools();
  }, []);

  const fetchManagerDetails = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/managers/${managerId}`);
      const manager = response.data;
      setManagerData({
        name: manager.name,
        email: manager.email,
        phoneNumber: manager.phoneNumber,
        schoolIds: manager.Schools.map(school => school.id),
      });
    } catch (error) {
      console.error('Error fetching manager details:', error);
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
    setManagerData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSchoolChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setManagerData(prevData => ({
        ...prevData,
        schoolIds: [...prevData.schoolIds, value],
      }));
    } else {
      setManagerData(prevData => ({
        ...prevData,
        schoolIds: prevData.schoolIds.filter(id => id !== value),
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://tms.up.school/api/managers/${managerId}`, managerData);
      alert('Manager updated successfully');
      navigate('/managers');
    } catch (error) {
      console.error('Error updating manager:', error);
      setErrorMessage('An error occurred while updating the manager account.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        await axios.delete(`https://tms.up.school/api/managers/${managerId}`);
        alert('Manager deleted successfully');
        navigate('/managers');
      } catch (error) {
        console.error('Error deleting manager:', error.message);
        setErrorMessage('Failed to delete the manager.');
      }
    }
  };

  return (
    <div className="edit-manager-container">
      <h2>Edit Manager Account</h2>
      {errorMessage && <p className="error">{errorMessage}</p>}
      <form onSubmit={handleFormSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={managerData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={managerData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={managerData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Schools</label>
          <div className="school-checkboxes">
            {schools.map(school => (
              <div key={school.id}>
                <input
                  type="checkbox"
                  value={school.id}
                  checked={managerData.schoolIds.includes(school.id)}
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
