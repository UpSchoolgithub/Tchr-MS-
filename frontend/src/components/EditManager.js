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
  const [currentAssignedPage, setCurrentAssignedPage] = useState(0);
  const [currentAvailablePage, setCurrentAvailablePage] = useState(0);
  const [sortAssignedAsc, setSortAssignedAsc] = useState(true);
  const [sortAvailableAsc, setSortAvailableAsc] = useState(true);
  const schoolsPerPage = 7;

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

  const handleSchoolRemove = (schoolId) => {
    setFormData(prevState => ({
      ...prevState,
      schoolIds: prevState.schoolIds.filter(id => id !== schoolId)
    }));
    const removedSchool = assignedSchools.find(school => school.id === schoolId);
    setAvailableSchools([...availableSchools, removedSchool]);
    setAssignedSchools(assignedSchools.filter(school => school.id !== schoolId));
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

  // Pagination controls for Assigned and Available Schools
  const assignedStartIndex = currentAssignedPage * schoolsPerPage;
  const assignedEndIndex = assignedStartIndex + schoolsPerPage;
  const paginatedAssignedSchools = assignedSchools.slice(assignedStartIndex, assignedEndIndex);

  const availableStartIndex = currentAvailablePage * schoolsPerPage;
  const availableEndIndex = availableStartIndex + schoolsPerPage;
  const paginatedAvailableSchools = availableSchools.slice(availableStartIndex, availableEndIndex);

  const handleNextAssignedPage = () => {
    if (assignedEndIndex < assignedSchools.length) {
      setCurrentAssignedPage(currentAssignedPage + 1);
    }
  };

  const handlePreviousAssignedPage = () => {
    if (currentAssignedPage > 0) {
      setCurrentAssignedPage(currentAssignedPage - 1);
    }
  };

  const handleNextAvailablePage = () => {
    if (availableEndIndex < availableSchools.length) {
      setCurrentAvailablePage(currentAvailablePage + 1);
    }
  };

  const handlePreviousAvailablePage = () => {
    if (currentAvailablePage > 0) {
      setCurrentAvailablePage(currentAvailablePage - 1);
    }
  };

  // Sorting
  const sortedAssignedSchools = [...paginatedAssignedSchools].sort((a, b) => {
    return sortAssignedAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  const sortedAvailableSchools = [...paginatedAvailableSchools].sort((a, b) => {
    return sortAvailableAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

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
        
        <div className="assigned-schools-header">
          <h3>Assigned Schools</h3>
          <button type="button" onClick={() => setShowAssignSchool(!showAssignSchool)} className="assign-new-school-button">
            Assign New School
          </button>
        </div>

        <table className="assigned-schools-table">
          <thead>
            <tr>
              <th>School ID <span className="sort-arrow" onClick={() => setSortAssignedAsc(!sortAssignedAsc)}>&#8593;&#8595;</span></th>
              <th>School Name <span className="sort-arrow" onClick={() => setSortAssignedAsc(!sortAssignedAsc)}>&#8593;&#8595;</span></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssignedSchools.map(school => (
              <tr key={school.id}>
                <td>{school.id}</td>
                <td>{school.name}</td>
                <td>
                  <button type="button" onClick={() => handleSchoolRemove(school.id)} className="remove-button">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-controls">
          <button type="button" onClick={handlePreviousAssignedPage} disabled={currentAssignedPage === 0} className="small-pagination-button">
            &#8249;
          </button>
          <button type="button" onClick={handleNextAssignedPage} disabled={assignedEndIndex >= assignedSchools.length} className="small-pagination-button">
            &#8250;
          </button>
        </div>

        {showAssignSchool && (
          <div className="school-checkboxes">
            <table className="available-schools-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>School Name <span className="sort-arrow" onClick={() => setSortAvailableAsc(!sortAvailableAsc)}>&#8593;&#8595;</span></th>
                </tr>
              </thead>
              <tbody>
                {sortedAvailableSchools.map(school => (
                  <tr key={school.id}>
                    <td>
                      <input
                        type="checkbox"
                        onChange={() => handleSchoolAssign(school.id)}
                      />
                    </td>
                    <td>{school.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-controls">
              <button type="button" onClick={handlePreviousAvailablePage} disabled={currentAvailablePage === 0} className="small-pagination-button">
                &#8249;
              </button>
              <button type="button" onClick={handleNextAvailablePage} disabled={availableEndIndex >= availableSchools.length} className="small-pagination-button">
                &#8250;
              </button>
            </div>
          </div>
        )}
        
        <button type="submit" className="save-button">Update Manager</button>
        <button type="button" className="delete-button" onClick={handleDelete}>Delete Manager</button>
      </form>
    </div>
  );
};

export default EditManager;
