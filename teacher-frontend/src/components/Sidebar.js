import React from 'react';
import { Link } from 'react-router-dom';
import { FaTachometerAlt, FaCalendarAlt, FaEnvelope, FaTasks, FaChalkboardTeacher, FaSignOutAlt } from 'react-icons/fa';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { teacherId, logout } = useTeacherAuth(); // Access the logout function from the context

  return (
    <div className="sidebar">
      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <img src="/Upschool_2x.png" alt="UpSchool Logo" />
      </div>

      <ul>
        {/* Dashboard */}
        <li>
          <Link to="/dashboard">
            <FaTachometerAlt className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Teacher Sessions */}
        {teacherId && (
          <li>
            <Link to={`/teacherportal/${teacherId}/teacher-sessions`}>
              <FaChalkboardTeacher className="icon" />
              <span>Teacher Sessions</span>
            </Link>
          </li>
        )}

        {/* School Calendar */}
        <li>
          <Link to="/school-calendar">
            <FaCalendarAlt className="icon" />
            <span>School Calendar</span>
          </Link>
        </li>

        {/* Request */}
        <li>
          <Link to="/request">
            <FaEnvelope className="icon" />
            <span>Request</span>
          </Link>
        </li>

        {/* View Activities */}
        <li>
          <Link to="/view-activities">
            <FaTasks className="icon" />
            <span>View Activities</span>
          </Link>
        </li>
      </ul>

      {/* Logout Button */}
      <div className="sidebar-bottom">
        <button className="logout-button" onClick={logout}>
          <FaSignOutAlt className="icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
