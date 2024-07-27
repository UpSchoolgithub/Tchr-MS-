import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';

const CreateTeacher = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const { managerId, token } = useManagerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get(`/managers/${managerId}/schools`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Fetched schools:', response.data);
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    if (managerId) {
      fetchSchools();
    }
  }, [managerId, token]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    const teacherData = {
      name,
      email,
      phone,
      password,
      schoolIds: selectedSchools,
    };
    console.log('Sending teacher data:', teacherData);
    try {
      const response = await axiosInstance.post('/teachers', teacherData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Teacher created:', response.data);
      navigate('/teachers');
    } catch (error) {
      console.error('Error creating teacher:', error);
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const handleSchoolChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedSchools([...selectedSchools, value]);
    } else {
      setSelectedSchools(selectedSchools.filter(id => id !== value));
    }
  };

  return (
    <div>
      <h2>Create Teacher</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleCreateTeacher}>
        <div>
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Phone:</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Schools:</label>
          {schools.map(school => (
            <div key={school.id}>
              <input
                type="checkbox"
                value={school.id}
                onChange={handleSchoolChange}
              />
              {school.name}
            </div>
          ))}
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CreateTeacher;
