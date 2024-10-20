import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateManager.css';

const CreateManager = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [schoolIds, setSchoolIds] = useState([]);
  const [schools, setSchools] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const schoolsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('authToken'); // Assuming the token is stored in localStorage
      const response = await axios.get('https://tms.up.school/api/managers/schools', {
        headers: {
          Authorization: `Bearer ${token}`, // Send the token in the request headers
        },
      });
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
      setErrorMessage('Error fetching schools.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Temporarily hardcode the token for testing
      const token = '<your_valid_token_here>';
  
      await axios.post(
        'https://tms.up.school/api/managers',
        { name, email, phoneNumber, password, schoolIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Send the token in the request headers
          },
        }
      );
      navigate('/managers');
    } catch (error) {
      console.error('Error:', error.response || error.message);
    }
  };
  
  

  

  const handleSchoolChange = (e) => {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      setSchoolIds([...schoolIds, value]);
    } else {
      if (window.confirm('Are you sure you want to remove this school from the manager?')) {
        setSchoolIds(schoolIds.filter(id => id !== value));
      }
    }
  };

  const indexOfLastSchool = currentPage * schoolsPerPage;
  const indexOfFirstSchool = indexOfLastSchool - schoolsPerPage;
  const currentSchools = schools.slice(indexOfFirstSchool, indexOfLastSchool);

  const nextPage = () => {
    if (currentPage < Math.ceil(schools.length / schoolsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="create-manager-container">
      <h2>Create Manager Account</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="phoneNumber">Phone Number</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
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
              {currentSchools.map((school) => (
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
        <div className="pagination-save-container">
          <div className="pagination-buttons">
            <button type="button" onClick={prevPage} disabled={currentPage === 1}>&lt;</button>
            <button type="button" onClick={nextPage} disabled={currentPage === Math.ceil(schools.length / schoolsPerPage)}>&gt;</button>
          </div>
          <button type="submit" className="save-button">Save</button>
        </div>
      </form>
    </div>
  );
};

export default CreateManager;
