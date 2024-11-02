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
  const [assignedSchools, setAssignedSchools] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [showAssignSchool, setShowAssignSchool] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchManagerDetails();
    fetchSchools();
  }, [managerId]);

  const fetchManagerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://tms.up.school/api/managers/${managerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const managerData = response.data;
      setFormData({
        name: managerData.name,
        email: managerData.email,
        phoneNumber: managerData.phoneNumber,
        schoolIds: managerData.Schools.map(school => school.id)
      });
      setAssignedSchools(managerData.Schools);
    } catch (error) {
      console.error('Error fetching manager details:', error.message);
      setErrorMessage('Error fetching manager details.');
    }
  };

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://tms.up.school/api/managers/schools', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const allSchools = response.data;
      const untaggedSchools = allSchools.filter(
        school => !formData.schoolIds.includes(school.id)
      );
      setAvailableSchools(untaggedSchools);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
      setErrorMessage('Error fetching schools.');
    }
  };

  const handleSchoolAssign = (schoolId) => {
    setFormData(prevState => ({
      ...prevState,
      schoolIds: [...prevState.schoolIds, schoolId]
    }));
    const assignedSchool = availableSchools.find(school => school.id === schoolId);
    setAssignedSchools([...assignedSchools, assignedSchool]);
    setAvailableSchools(availableSchools.filter(school => school.id !== schoolId));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://tms.up.school/api/managers/${managerId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate('/managers');
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
        const token = localStorage.getItem('token');
        await axios.delete(`https://tms.up.school/api/managers/${managerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        navigate('/managers');
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
          <label>Assigned Schools</label>
          <ul>
            {assignedSchools.map(school => (
              <li key={school.id}>{school.name}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowAssignSchool(!showAssignSchool)}>
            Assign New School
          </button>
          {showAssignSchool && (
            <div className="school-checkboxes">
              {availableSchools.map(school => (
                <div key={school.id}>
                  <button type="button" onClick={() => handleSchoolAssign(school.id)}>
                    {school.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="save-button">Update Manager</button>
        <button type="button" className="delete-button" onClick={handleDelete}>Delete Manager</button>
      </form>
    </div>
  );
};

export default EditManager;
