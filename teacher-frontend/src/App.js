import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar'; 
import Session from './components/Session';
import Classroom from './components/Classroom';
import SchoolCalendar from './components/SchoolCalendar';
import Request from './components/Request';
import ViewActivities from './components/ViewActivities';
import TeacherAuthProvider, { useTeacherAuth } from './context/TeacherAuthContext';
import { WebSocketProvider } from './WebSocketContext';
import { useLocation, useNavigate } from 'react-router-dom';

function InnerApp() {
  const { token } = useTeacherAuth();

  return (
    <WebSocketProvider token={token}>
      <Router>
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

function App() {
  return (
    <TeacherAuthProvider>
      <InnerApp />
    </TeacherAuthProvider>
  );
}

export default App;
