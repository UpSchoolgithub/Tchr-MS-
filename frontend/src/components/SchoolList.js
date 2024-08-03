import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './SchoolList.css';

const SchoolList = () => {
  const [schools, setSchools] = useState([]);
  const [sortedSchools, setSortedSchools] = useState([]);
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolsPerPage, setSchoolsPerPage] = useState(5);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axios.get('https://tms.up.school/api/schools');
        setSchools(response.data);
        setSortedSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools', error);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    let filteredSchools = schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredSchools = filteredSchools.sort((a, b) => {
      if (sortOrder === 'nameAsc') {
        return a.name.localeCompare(b.name);
      } else if (sortOrder === 'nameDesc') {
        return b.name.localeCompare(a.name);
      } else if (sortOrder === 'dateAsc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOrder === 'dateDesc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setSortedSchools(filteredSchools);
  }, [searchTerm, sortOrder, schools]);

  const indexOfLastSchool = currentPage * schoolsPerPage;
  const indexOfFirstSchool = indexOfLastSchool - schoolsPerPage;
  const currentSchools = sortedSchools.slice(indexOfFirstSchool, indexOfLastSchool);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <h3>Schools List</h3>
      <div className="sort-search">
        <label>Sort by:</label>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="nameAsc">Name Ascending</option>
          <option value="nameDesc">Name Descending</option>
          <option value="dateAsc">Date Ascending</option>
          <option value="dateDesc">Date Descending</option>
        </select>
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Link to="/school/create">
        <button className="create-school-button">Create School</button>
      </Link>
      <div id="schoolList" className="school-list">
        {currentSchools.map((school, index) => (
          <div key={school.id} className="school-item">
            <h4>{school.name}</h4>
            <p>{school.email}</p>
            <p>{school.website}</p>
            {school.logo && <img src={`http://localhost:5000/${school.logo}`} alt={`${school.name} logo`} style={{ width: '100px' }} />}
            <p>Created At: {new Date(school.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
      <div className="pagination">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={indexOfLastSchool >= sortedSchools.length}>Next</button>
      </div>
      <div className="schools-per-page">
        <label>Schools per page:</label>
        <select value={schoolsPerPage} onChange={(e) => setSchoolsPerPage(Number(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
        </select>
      </div>
    </div>
  );
};

export default SchoolList;
