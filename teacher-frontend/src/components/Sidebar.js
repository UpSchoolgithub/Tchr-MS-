import React from 'react';
import { Link } from 'react-router-dom';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { teacherId } = useTeacherAuth(); // Assuming teacherId is available in the context

  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/session">Session</Link>
        </li>
        <li>
          <Link to="/classroom">Classroom</Link>
        </li>
        <li>
          <Link to="/school-calendar">School Calendar</Link>
        </li>
        <li>
          <Link to="/request">Request</Link>
        </li>
        <li>
          <Link to="/view-activities">View Activities</Link>
        </li>
        {/* New Teacher Sessions Link */}
        {teacherId && (
          <li>
            <Link to={`/teacherportal/${teacherId}/teacher-sessions`}>Teacher Sessions</Link>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
