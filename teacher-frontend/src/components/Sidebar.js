import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaEnvelope,
  FaTasks,
  FaChalkboardTeacher,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { teacherId, logout } = useTeacherAuth(); // Access logout and teacher ID from context
  const location = useLocation(); // To check the current active route
  const [isCollapsed, setIsCollapsed] = useState(false); // State for collapsible sidebar

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <img src="/Upschool_2x.png" alt="UpSchool Logo" />
      </div>

      <ul>
        {/* Dashboard */}
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">
            <FaTachometerAlt className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Teacher Sessions */}
        {teacherId && (
          <li
            className={
              location.pathname.includes(`/teacherportal/${teacherId}/teacher-sessions`)
                ? 'active'
                : ''
            }
          >
            <Link to={`/teacherportal/${teacherId}/teacher-sessions`}>
              <FaChalkboardTeacher className="icon" />
              <span>Teacher Sessions</span>
            </Link>
          </li>
        )}

        {/* School Calendar */}
        <li className={location.pathname === '/school-calendar' ? 'active' : ''}>
          <Link to="/school-calendar">
            <FaCalendarAlt className="icon" />
            <span>School Calendar</span>
          </Link>
        </li>

        {/* Request */}
        <li className={location.pathname === '/request' ? 'active' : ''}>
          <Link to="/request">
            <FaEnvelope className="icon" />
            <span>Request</span>
          </Link>
        </li>

        {/* View Activities */}
        <li className={location.pathname === '/view-activities' ? 'active' : ''}>
          <Link to="/view-activities">
            <FaTasks className="icon" />
            <span>View Activities</span>
          </Link>
        </li>
      </ul>

      {/* Logout Button */}
      <div className="sidebar-bottom">
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
