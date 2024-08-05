import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const editingManager = location.state?.manager || null;

  useEffect(() => {
    fetchSchools();

    if (editingManager) {
      setName(editingManager.name);
      setEmail(editingManager.email);
      setPhoneNumber(editingManager.phoneNumber);
      setSchoolIds(editingManager.Schools.map(school => school.id));
    }
  }, [editingManager]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('https://tms.up.school/api/managers/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const managerData = { name, email, phoneNumber, schoolIds };

    if (editingManager) {
      // Update existing manager
      try {
        await axios.put(`https://tms.up.school/api/managers/${editingManager.id}`, managerData);
        navigate('/managers'); // Redirect back to manager list
      } catch (error) {
        setErrorMessage('An error occurred while updating the manager account.');
      }
    } else {
      // Create new manager
      try {
        await axios.post('https://tms.up.school/api/managers', managerData);
        navigate('/managers'); // Redirect back to manager list
      } catch (error) {
        setErrorMessage('An error occurred while saving the manager account.');
      }
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

  return (
    <div className="create-manager-container">
      <h2>{editingManager ? 'Edit Manager Account' : 'Create Manager Account'}</h2>
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
        {!editingManager && (
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
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
              {schools.slice((currentPage - 1) * schoolsPerPage, currentPage * schoolsPerPage).map((school) => (
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
            <button type="button" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              &lt;
            </button>
            <button type="button" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === Math.ceil(schools.length / schoolsPerPage)}>
              &gt;
            </button>
          </div>
          <button type="submit" className="save-button">{editingManager ? 'Update' : 'Create'} Manager</button>
        </div>
      </form>
    </div>
  );
};

export default CreateManager;
