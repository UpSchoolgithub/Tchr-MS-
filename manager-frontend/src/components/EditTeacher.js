import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';

const EditTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [schools, setSchools] = useState([]);
  const { managerId, token } = useManagerAuth();

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axiosInstance.get(`/teachers/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const teacherData = response.data;
        setName(teacherData.name);
        setEmail(teacherData.email);
        setPhone(teacherData.phone);
        setSelectedSchools(teacherData.Schools.map(school => school.id));
      } catch (error) {
        console.error('Error fetching teacher:', error);
      }
    };

    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get(`/managers/${managerId}/schools`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    if (managerId) {
      fetchTeacher();
      fetchSchools();
    }
  }, [id, managerId, token]);

  const handleSchoolChange = (e) => {
    const { value, checked } = e.target;
    const schoolId = parseInt(value); // Ensure the schoolId is an integer
    if (checked) {
      setSelectedSchools([...selectedSchools, schoolId]);
    } else {
      setSelectedSchools(selectedSchools.filter(id => id !== schoolId));
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/teachers/${id}`, {
        name,
        email,
        phone,
        password,
        schoolIds: selectedSchools,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      navigate('/teachers');
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  };

  return (
    <div>
      <h2>Edit Teacher</h2>
      <form onSubmit={handleUpdateTeacher}>
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
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label>Schools:</label>
          {schools.map(school => (
            <div key={school.id}>
              <input
                type="checkbox"
                value={school.id}
                checked={selectedSchools.includes(school.id)}
                onChange={handleSchoolChange}
              />
              {school.name}
            </div>
          ))}
        </div>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default EditTeacher;
