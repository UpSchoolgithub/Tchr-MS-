import React from 'react';
import { useNavigate } from 'react-router-dom';

const MViewTeachers = ({ teachers }) => {
  const navigate = useNavigate();

  const handleViewTimetable = (teacherId) => {
    navigate(`/teachers/timetable/${teacherId}`);
  };

  return (
    <div className="view-teachers">
      <h1>Teachers</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>{teacher.name}</td>
              <td>
                <button onClick={() => handleViewTimetable(teacher.id)}>View Timetable</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MViewTeachers;
