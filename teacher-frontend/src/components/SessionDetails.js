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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const schoolId = paramId;

  // Fetch school details when component mounts or schoolId changes
  useEffect(() => {
    const fetchSchoolDetails = async () => {
      setLoading(true);
      setError(null);
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
        setError('Failed to load school details');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchSchoolDetails();
    }
  }, [schoolId]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSchool((prevSchool) => ({
      ...prevSchool,
      [name]: value
    }));
  };

  // Handle form submission
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

  // Render loading or error states
  if (loading) return <p>Loading school details...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>{schoolId ? 'Edit' : 'Create'} School</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">School Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={school.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="email">School Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={school.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone">Phone Number:</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={school.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="website">Website:</label>
          <input
            type="text"
            id="website"
            name="website"
            value={school.website}
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
