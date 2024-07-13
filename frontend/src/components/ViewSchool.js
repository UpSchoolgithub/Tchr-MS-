import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './TimetableSettings.css';  // Import the CSS file

const ViewSchool = () => {
  const { schoolId } = useParams();
  const [school, setSchool] = useState(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const response = await axios.get(`/api/schools/${schoolId}`);
        setSchool(response.data);
      } catch (error) {
        console.error('Error fetching school', error);
      }
    };

    fetchSchool();
  }, [schoolId]);

  if (!school) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h3>{school.name}</h3>
      <p>Email: {school.email}</p>
      <p>Website: {school.website}</p>
      {school.logo && <img src={`/uploads/${school.logo}`} alt="School Logo" />}
    </div>
  );
};

export default ViewSchool;
