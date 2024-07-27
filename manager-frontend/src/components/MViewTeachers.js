import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MViewTeachers.css';

const MViewTeachers = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/api/teachers');
        setTeachers(response.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <div className="view-teachers">
      <h2>View Teachers</h2>
      <ul>
        {teachers.map(teacher => (
          <li key={teacher.id}>
            <p>Name: {teacher.name}</p>
            <p>Email: {teacher.email}</p>
            <p>Phone Number: {teacher.phoneNumber}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MViewTeachers;
