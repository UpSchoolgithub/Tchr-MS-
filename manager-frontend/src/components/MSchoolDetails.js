import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const MSchoolDetails = () => {
  const { schoolId } = useParams();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchClassesAndSections = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/schools/${schoolId}/classes`);
        setClasses(response.data.classes);
        setSections(response.data.sections);
      } catch (error) {
        console.error('Error fetching classes and sections:', error);
      }
    };
    fetchClassesAndSections();
  }, [schoolId]);

  return (
    <div>
      <h1>School Details</h1>
      <h2>Classes</h2>
      <ul>
        {classes.map((cls) => (
          <li key={cls.id}>{cls.name}</li>
        ))}
      </ul>
      <h2>Sections</h2>
      <ul>
        {sections.map((section) => (
          <li key={section.id}>{section.name}</li>
        ))}
      </ul>
      <div>
        <Link to={`/school/${schoolId}/calendar`}>School Calendar</Link>
        <Link to={`/school/${schoolId}/timetable-settings`}>Timetable Settings</Link>
        <Link to={`/school/${schoolId}/students`}>Students</Link>
      </div>
    </div>
  );
};

export default MSchoolDetails;
