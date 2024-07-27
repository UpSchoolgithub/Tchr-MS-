import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiMail, FiActivity, FiLogOut } from 'react-icons/fi';
import './MSidebar.css';

const MSidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/Upschool_2x.png" alt="UpSchool Logo" />
      </div>
      <ul>
        <li>
          <Link to="/dashboard">
            <FiHome className="icon" /> Dashboard
          </Link>
        </li>
        <li>
          <Link to="/classroom">
            <FiBook className="icon" /> Classroom
          </Link>
        </li>
        <li>
          <Link to="/teachers">
            <FiUsers className="icon" /> Teachers
          </Link>
        </li>
        <li>
          <Link to="/request">
            <FiMail className="icon" /> Request
          </Link>
        </li>
        <li>
          <Link to="/view-activities">
            <FiActivity className="icon" /> View Activities
          </Link>
        </li>
      </ul>
      <ul className="sidebar-bottom">
        <li>
          <Link to="/mlogin" onClick={() => localStorage.removeItem('token')}>
            <FiLogOut className="icon" /> Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default MSidebar;
