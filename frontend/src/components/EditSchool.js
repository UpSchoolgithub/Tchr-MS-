import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, NavLink } from 'react-router-dom';
import axios from 'axios';
import '../styles.css'; 

const EditSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState({
    name: '',
    email: '',
    phone: '',
    website: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/schools/${id}`);
        setSchool({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          website: response.data.website || ''
        });
      } catch (error) {
        console.error('Error fetching school details:', error);
        setError('Failed to fetch school details.');
      }
    };

    if (id) {
      fetchSchoolDetails();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSchool((prevSchool) => ({
      ...prevSchool,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`https://tms.up.school/api/schools/${id}`, school);
        alert('School updated successfully!');
      } else {
        const response = await axios.post('https://tms.up.school/api/schools', school);
        const newSchoolId = response.data.newSchool.id;

        // Create related entries
        await axios.post(`https://tms.up.school/api/schools/${newSchoolId}/timetable`, {
          schoolId: newSchoolId,
          periodsPerDay: 8,
          durationPerPeriod: 45,
          schoolStartTime: '08:00:00',
          schoolEndTime: '15:00:00',
          reserveType: 'time',
        });

        navigate(`/edit-school/${newSchoolId}/details`);
      }
    } catch (error) {
      console.error('Error saving school:', error);
      alert('Failed to save school.');
    }
  };

  return (
    <div className="edit-school-container">
      {error && <p className="error">{error}</p>}
      <div className="tabs">
        <NavLink to={`/edit-school/${id}/details`} className="tab-button">School Details</NavLink>
        <NavLink to={`/edit-school/${id}/timetable`} className="tab-button">Timetable Settings</NavLink>
        <NavLink to={`/edit-school/${id}/calendar`} className="tab-button">School Calendar</NavLink>
        <NavLink to={`/edit-school/${id}/classes`} className="tab-button">Class Info</NavLink>
        <NavLink to={`/edit-school/${id}/members`} className="tab-button">Members</NavLink>
      </div>
      <Outlet context={{ schoolId: id }} />
    </div>
  );
};

export default EditSchool;
