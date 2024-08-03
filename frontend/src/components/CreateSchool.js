import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateSchool.css'; 

const CreateSchool = () => {
  const [schools, setSchools] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolsPerPage, setSchoolsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axios.get('https://tms.up.school/api/schools');
        console.log('Fetched schools:', response.data);
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, []);

  const handleEditSchool = (id) => {
    navigate(`/edit-school/${id}/details`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = () => {
    setSortOption(sortOption === 'asc' ? 'desc' : 'asc');
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSchoolsPerPageChange = (e) => {
    setSchoolsPerPage(Number(e.target.value));
  };

  const sortedSchools = [...schools].sort((a, b) => {
    if (sortOption === 'asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortOption === 'desc') {
      return (b.name || '').localeCompare(a.name || '');
    }
    return 0;
  });

  const filteredSchools = sortedSchools.filter(school =>
    (school.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastSchool = currentPage * schoolsPerPage;
  const indexOfFirstSchool = indexOfLastSchool - schoolsPerPage;
  const currentSchools = filteredSchools.slice(indexOfFirstSchool, indexOfLastSchool);

  return (
    <div className="container">
      <div className="header-container">
        <button className="school-button" onClick={() => navigate('/school')}>Create School</button>
      </div>

      <div className="heading-container">
        <h2>Existing Schools</h2>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="school-list-container">
        <div className="table-responsive">
          <table className="school-table">
            <thead>
              <tr>
                <th className="serial-column">#</th>
                <th onClick={handleSort} className="sortable-column">
                  Name {sortOption === 'asc' ? '↑' : '↓'}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSchools.map((school, index) => (
                <tr key={school.id} onClick={() => handleEditSchool(school.id)} className="school-item">
                  <td className="serial-column">{indexOfFirstSchool + index + 1}</td>
                  <td>{school.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-controls">
        <div className="pagination-controls">
          <label>
            Schools per page:
            <select value={schoolsPerPage} onChange={handleSchoolsPerPageChange}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>

        <div className="pagination-buttons">
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            &lt; 
          </button>
          <button onClick={handleNextPage} disabled={indexOfLastSchool >= filteredSchools.length}>
             &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSchool;
