import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const Classroom = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(''); // State to manage selected board
  const boards = ['ICSE', 'CBSE', 'STATE']; // Predefined boards

  useEffect(() => {
    // Fetch all schools along with their classes and sections filtered by board
    const fetchSchools = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get('/schools'); // Fetch schools first
        const schoolData = response.data;

        const schoolsWithClasses = await Promise.all(
          schoolData.map(async (school) => {
            const classesResponse = await axiosInstance.get(`/schools/${school.id}/classes`, {
              params: { board: selectedBoard }, // Pass the selected board as a query parameter
            });
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
      } catch (error) {
        console.error('Error fetching schools and their classes:', error);
        setError('Failed to load school data');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [selectedBoard]); // Re-fetch data when the selected board changes

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Classroom</h2>
      <div>
        <label htmlFor="board-select">Select Board: </label>
        <select
          id="board-select"
          value={selectedBoard}
          onChange={(e) => setSelectedBoard(e.target.value)}
        >
          <option value="">All</option>
          {boards.map((board) => (
            <option key={board} value={board}>
              {board}
            </option>
          ))}
        </select>
      </div>
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
                      <strong>Class {classInfo.className}</strong> ({classInfo.board})
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
