import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar'; // Ensure Sidebar is imported
import Session from './components/Session'; // Import other components as needed
import Classroom from './components/Classroom';
import SchoolCalendar from './components/SchoolCalendar';
import Request from './components/Request';
import ViewActivities from './components/ViewActivities';
import { useTeacherAuth } from './context/TeacherAuthContext';
import { WebSocketProvider } from './WebSocketContext';

function InnerApp() {
  const { token } = useTeacherAuth();

  return (
    <WebSocketProvider token={token}>
      <Router>
        {/* Render the Sidebar here so it appears on every page except /login */}
        {token && <Sidebar />} 
        <div className={token ? "content-with-sidebar" : "content"}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/school-calendar" element={<SchoolCalendar />} />
            <Route path="/request" element={<Request />} />
            <Route path="/view-activities" element={<ViewActivities />} />
            {/* Add other routes as needed */}
          </Routes>
        </div>
      </Router>
    </WebSocketProvider>
  );
}

export default App;
