import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateManager.css';

const Manager = () => {
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const managersPerPage = 7;

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, please log in.');
        return;
      }
  
      const response = await axios.get('https://tms.up.school/api/managers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
  
      if (error.response && error.response.status === 403) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
      }
    }
  };

  const handleEdit = (managerId) => {
    navigate(`/edit-manager/${managerId}`);
  };

  const handleDelete = async (id, schoolCount) => {
    const message = schoolCount > 0 
      ? 'This manager is tagged to a school. Are you sure you want to delete this manager?' 
      : 'Are you sure you want to delete this manager?';

    if (window.confirm(message)) {
      try {
        await axios.delete(`https://tms.up.school/api/managers/${id}`);
        fetchManagers();
      } catch (error) {
        console.error('Error deleting manager:', error.message);
      }
    }
  };

  const handleCreateManager = () => {
    navigate('/create-manager');
  };

  // Pagination Controls
  const startIndex = currentPage * managersPerPage;
  const endIndex = startIndex + managersPerPage;
  const paginatedManagers = managers.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (endIndex < managers.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Search and Sort
  const filteredManagers = managers
    .filter(manager => manager.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const toggleSort = () => {
    setSortAsc(!sortAsc);
  };

  return (
    <div className="manager-container">
      <div className="manager-list">
        <h2>Managers</h2>
        <div className="controls">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <button className="save-button" onClick={handleCreateManager}>Create Manager</button>
        </div>
        <table className="manager-table">
          <thead>
            <tr>
              <th onClick={toggleSort} style={{ cursor: 'pointer' }}>
                Name {sortAsc ? '▲' : '▼'}
              </th>
              <th>Email</th>
              <th>Phone Number</th>
              <th>Schools</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredManagers.slice(startIndex, endIndex).map((manager) => (
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
        <div className="pagination-controls">
          <button onClick={handlePreviousPage} disabled={currentPage === 0} className="pagination-button">
            Previous
          </button>
          <button onClick={handleNextPage} disabled={endIndex >= filteredManagers.length} className="pagination-button">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Manager;
