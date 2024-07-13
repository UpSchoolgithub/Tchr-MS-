import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiBookOpen, FiUser, FiLogOut } from 'react-icons/fi'; // Import FiLogOut icon
import './Sidebar.css';  // Import the CSS file

const Sidebar = () => {
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
                    <Link to="/create-school">
                        <FiBookOpen className="icon" /> School
                    </Link>
                </li>
                <li>
                    <Link to="/manager">
                        <FiUser className="icon" /> Manager
                    </Link>
                </li>
            </ul>
            <ul className="sidebar-bottom">
                <li>
                    <Link to="/logout">
                        <FiLogOut className="icon" /> Logout
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
