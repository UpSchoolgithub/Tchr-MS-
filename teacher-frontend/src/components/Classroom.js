import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const Classroom = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all schools along with their classes and sections (combined sections)
    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get('/schools'); // Adjust the route as needed
        const schoolData = response.data;

        const schoolsWithClasses = await Promise.all(
          schoolData.map(async (school) => {
            const classesResponse = await axiosInstance.get(`/schools/${school.id}/classes`);
            const classes = await Promise.all(
              classesResponse.data.map(async (classInfo) => {
                const sectionsResponse = await axiosInstance.get(
                  `/schools/${school.id}/classes/${classInfo.id}/sections`
                );
                return { ...classInfo, sections: sectionsResponse.data };
              })
            );
            return { ...school, classes };
          })
        );
        
        setSchools(schoolsWithClasses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schools and their classes:', error);
        setError('Failed to load school data');
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Classroom</h2>
      {schools.length === 0 ? (
        <p>No schools found.</p>
      ) : (
        <ul>
          {schools.map((school) => (
            <li key={school.id}>
              <h3>{school.name}</h3>
              {school.classes.length === 0 ? (
                <p>No classes available for this school.</p>
              ) : (
                <ul>
                  {school.classes.map((classInfo) => (
                    <li key={classInfo.id}>
                      <strong>Class {classInfo.className}</strong>
                      {classInfo.sections.length === 0 ? (
                        <p>No sections available for this class.</p>
                      ) : (
                        <ul>
                          {classInfo.sections.map((section) => (
                            <li key={section.id}>Section: {section.sectionName}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Classroom;
