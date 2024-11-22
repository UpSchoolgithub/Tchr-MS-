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
import TeacherSessions from './components/TeacherSessions';
import SessionDetails from './components/SessionDetails'; // Import the SessionDetails component

function PrivateRoute({ children }) {
  const { token } = useTeacherAuth();
  return token ? children : <Navigate to="/login" />;
}

function InnerApp() {
  const { token } = useTeacherAuth();

  return (
    <WebSocketProvider token={token}>
      <Router>
        {token && <Sidebar />} {/* Sidebar only appears when logged in */}
        <div className={token ? "content-with-sidebar" : "content"}>
          <Routes>
            {/* Redirect to dashboard or login based on token */}
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes that require login */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/classroom" element={<PrivateRoute><Classroom /></PrivateRoute>} />
            <Route path="/school-calendar" element={<PrivateRoute><SchoolCalendar /></PrivateRoute>} />
            <Route path="/request" element={<PrivateRoute><Request /></PrivateRoute>} />
            <Route path="/view-activities" element={<PrivateRoute><ViewActivities /></PrivateRoute>} />
            <Route path="/session" element={<PrivateRoute><Session /></PrivateRoute>} />
            <Route path="/teacherportal/:teacherId/session-details/:classId/:sectionId/:subjectId/:sessionId/:sessionPlanId" 
            element={<PrivateRoute><SessionDetails /></PrivateRoute>} />
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
