import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Outlet } from 'react-router-dom';

const SchoolDetails = ({ onSave }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState({
    name: '',
    email: '',
    phone: '',
    website: ''
  });
  const schoolId = paramId;

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}`);
        setSchool(response.data || {
          name: '',
          email: '',
          phone: '',
          website: ''
        });
      } catch (error) {
        console.error('Error fetching school details:', error);
        alert('Failed to fetch school details. Please try again later.');
      }
      
    };

    if (schoolId) {
      fetchSchoolDetails();
    }
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSchool((prevSchool) => ({
      ...prevSchool,
      [name]: value || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (schoolId) {
        await axios.put(`https://tms.up.school/api/schools/${schoolId}`, school);
      } else {
        const response = await axios.post('https://tms.up.school/api/schools', school);
        onSave(response.data.id);
        navigate(`/edit-school/${response.data.id}/details`);
      }
      alert('School saved successfully!');
    } catch (error) {
      console.error('Error saving school:', error);
      alert('Failed to save school.');
    }
  };

  return (
    <div>
      <h2>{schoolId ? 'Edit' : 'Create'} School</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>School Name:</label>
          <input
            type="text"
            name="name"
            value={school.name || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>School Email:</label>
          <input
            type="email"
            name="email"
            value={school.email || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Phone Number:</label>
          <input
            type="text"
            name="phone"
            value={school.phone || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Website:</label>
          <input
            type="text"
            name="website"
            value={school.website || ''}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Save School</button>
      </form>
      <Outlet context={{ schoolId }} />
    </div>
  );
};

export default SchoolDetails;
