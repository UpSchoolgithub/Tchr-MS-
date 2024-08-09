import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../WebSocketContext'; // Import the WebSocket context
import './MDashboard.css'; // Import the CSS file for styling

const MDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const ws = useWebSocket(); // Use the WebSocket instance

  useEffect(() => {
    // Simulate a loading time or fetch data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ws) {
      // Handle incoming messages from the WebSocket
      ws.onmessage = (event) => {
        console.log('Dashboard received message: ', event.data);
        // You can parse the data and update the component state if needed
      };

      ws.onerror = (error) => {
        console.error('WebSocket error in Dashboard: ', error);
      };
    }
  }, [ws]); // Re-run this effect if the WebSocket instance changes

  return (
    <div className="dashboard-container">
      <div className="gif-container">
        <img src="/f841ac2befaedda240c55a06b23b33ec.gif" alt="Welcome" className="full-page-gif" />
        
      </div>
      {!isLoading && (
        <div className="welcome-message">
          <h2>Welcome, Manager!</h2>
          <p>We're glad to have you back. Here's your dashboard.</p>
          {/* You can display WebSocket data here if needed */}
        </div>
      )}
    </div>
  );
};

export default MDashboard;
