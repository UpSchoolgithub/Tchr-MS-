import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/session">Session</Link> {/* Link to the Session page */}
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
      </ul>
    </div>
  );
};

export default Sidebar;
