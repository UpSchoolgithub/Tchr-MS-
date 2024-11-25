import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaSchool, FaUserTie, FaCalendarAlt, FaTasks, FaSignOutAlt } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Sidebar Logo */}
      <div className="sidebar-logo">
        <img src="/Upschool_2x.png" alt="UpSchool Logo" />
      </div>

      {/* Sidebar Menu */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard">
            <FaHome className="icon" />
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/school">
            <FaSchool className="icon" />
            School
          </Link>
        </li>
        <li>
          <Link to="/manager">
            <FaUserTie className="icon" />
            Manager
          </Link>
        </li>
        <li>
          <Link to="/school-calendar">
            <FaCalendarAlt className="icon" />
            Calendar
          </Link>
        </li>
        <li>
          <Link to="/activities">
            <FaTasks className="icon" />
            Activities
          </Link>
        </li>
      </ul>

      {/* Logout Button */}
      <div className="sidebar-logout">
        <Link to="/logout">
          <FaSignOutAlt className="icon" />
          Logout
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
