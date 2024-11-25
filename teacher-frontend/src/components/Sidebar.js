import React from 'react';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaCalendarAlt, FaEnvelope, FaTasks, FaChalkboardTeacher } from 'react-icons/fa';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { teacherId } = useTeacherAuth(); // Assuming teacherId is available in the context

  return (
    <div className="sidebar">
      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <img src="/Upschool_2x.png" alt="UpSchool Logo" />
      </div>
      <ul>
        <li>
          <Link to="/dashboard">
            <FaTachometerAlt className="icon" />
            Dashboard
          </Link>
        </li>
        {/* New Teacher Sessions Link */}
        {teacherId && (
          <li>
            <Link to={`/teacherportal/${teacherId}/teacher-sessions`}>
              <FaChalkboardTeacher className="icon" />
              Teacher Sessions
            </Link>
          </li>
        )}
        <li>
          <Link to="/school-calendar">
            <FaCalendarAlt className="icon" />
            School Calendar
          </Link>
        </li>
        <li>
          <Link to="/request">
            <FaEnvelope className="icon" />
            Request
          </Link>
        </li>
        <li>
          <Link to="/view-activities">
            <FaTasks className="icon" />
            View Activities
          </Link>
        </li>
        
      </ul>
    </div>
  );
};

export default Sidebar;
