import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './CreateManager.css';

const EditManager = () => {
  const { managerId } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [schoolIds, setSchoolIds] = useState([]);
  const [schools, setSchools] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchManagerDetails();
    fetchSchools();
  }, []);

  const fetchManagerDetails = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/managers/${managerId}`);
      const manager = response.data;
      setName(manager.name);
      setEmail(manager.email);
      setPhoneNumber(manager.phoneNumber);
      setSchoolIds(manager.Schools.map(school => school.id));
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

  const handleSchoolChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setSchoolIds([...schoolIds, value]);
    } else {
      setSchoolIds(schoolIds.filter(id => id !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://tms.up.school/api/managers/${managerId}`, { name, email, phoneNumber, schoolIds });
      navigate('/managers');  // Redirect back to manager list
    } catch (error) {
      console.error('Error updating manager account:', error.message);
      setErrorMessage('An error occurred while updating the manager account.');
    }
  };

  return (
    <div className="create-manager-container">
      <h2>Edit Manager Account</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </div>
        <div>
          <label>Schools</label>
          <table className="manager-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>School Name</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>
                  <td>
                    <input
                      type="checkbox"
                      value={school.id}
                      checked={schoolIds.includes(school.id)}
                      onChange={handleSchoolChange}
                    />
                  </td>
                  <td>{school.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="submit" className="save-button">Update Manager</button>
      </form>
    </div>
  );
};

export default EditManager;
