import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Import the CSS file for styling

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading time or fetch data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // 3 seconds for demonstration purposes

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="gif-container">
        <img src="/5c66944c27cd5-unscreen.gif" alt="Welcome" className="full-page-gif" />
      </div>
      {!isLoading && (
        <div className="welcome-message">
          <h2>Welcome, Super Manager!</h2>
          <p>We're glad to have you back. Here's your dashboard.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
