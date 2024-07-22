import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Manager.css';

const Manager = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [schoolIds, setSchoolIds] = useState([]);
  const [managers, setManagers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingManager, setEditingManager] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const schoolsPerPage = 10;

  useEffect(() => {
    fetchManagers();
    fetchSchools();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/managers');
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/managers/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingManager) {
        await axios.put(`http://localhost:5000/api/managers/${editingManager.id}`, { name, email, phoneNumber, password, schoolIds });
      } else {
        await axios.post('http://localhost:5000/api/managers', { name, email, phoneNumber, password, schoolIds });
      }
      fetchManagers(); // Refresh the list of managers
      resetForm();
      setErrorMessage('');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.errors.join(', '));
      } else {
        console.error('Error saving manager account:', error.message);
        setErrorMessage('An error occurred while saving the manager account.');
      }
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

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setName(manager.name);
    setEmail(manager.email);
    setPhoneNumber(manager.phoneNumber);
    setSchoolIds(manager.Schools.map(school => school.id));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        await axios.delete(`http://localhost:5000/api/managers/${id}`);
        fetchManagers(); // Refresh the list of managers
      } catch (error) {
        console.error('Error deleting manager:', error.message);
      }
    }
  };

  const resetForm = () => {
    setEditingManager(null);
    setName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setSchoolIds([]);
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
    <div className="manager-container">
      <h2>{editingManager ? 'Edit Manager Account' : 'Create Manager Account'}</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <div className="manager-form">
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
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
                <button onClick={() => handleEdit(manager)}>Edit</button>
                <button onClick={() => handleDelete(manager.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Manager;
