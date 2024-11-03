import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { WebSocketProvider } from './WebSocketContext'; // Import the WebSocket context
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import School from './components/School';
import Manager from './components/Manager';
import CreateSchool from './components/CreateSchool';
import EditSchool from './components/EditSchool';
import SchoolDetails from './components/SchoolDetails';
import TimetableSettings from './components/TimetableSettings';
import SchoolCalendar from './components/SchoolCalendar';
import ClassInfo from './components/ClassInfo';
import Members from './components/Members';
import SchoolPage from './pages/SchoolPage';
import SessionManagement from './components/SessionManagement';
import SessionPlan from './components/SessionPlan';
import AddSection from './components/AddSection';
import CreateManager from './components/CreateManager';
import EditManager from './components/EditManager';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // ProtectedRoute component that checks if the user is authenticated
  const ProtectedRoute = ({ element }) => {
    return token ? element : <Navigate to="/login" />;
  };

  return (
    <WebSocketProvider token={token}>
      <Router>
        <div className="app">
          {token && <Sidebar />}
          <div className="main-content">
            <Routes>
              <Route path="/login" element={<LoginForm setToken={setToken} />} />
              <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/school" element={<ProtectedRoute element={<School />} />} />
              <Route path="/manager" element={<ProtectedRoute element={<Manager />} />} />
              <Route path="/create-school" element={<ProtectedRoute element={<CreateSchool />} />} />
              <Route path="/edit-school/:id" element={<ProtectedRoute element={<EditSchool />} />} >
                <Route path="details" element={<ProtectedRoute element={<SchoolDetails />} />} />
                <Route path="timetable" element={<ProtectedRoute element={<TimetableSettings />} />} />
                <Route path="calendar" element={<ProtectedRoute element={<SchoolCalendar />} />} />
                <Route path="classes" element={<ProtectedRoute element={<ClassInfo />} />} />
                <Route path="members" element={<ProtectedRoute element={<Members />} />} />
              </Route>

              {/* Route for Session Management, with parameters for schoolId, classId, sectionId, and subjectId */}
              <Route path="/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId/sessions" 
                    element={<ProtectedRoute element={<SessionManagement />} />} />

              {/* Route for Session Plan */}
              <Route path="/sessions/:sessionId/sessionPlans" element={<ProtectedRoute element={<SessionPlan />} />} />

              {/* Additional Routes */}
              <Route path="/add-section" element={<ProtectedRoute element={<AddSection />} />} />
              <Route path="/logout" element={<Logout setToken={setToken} />} />
              <Route path="/managers" element={<ProtectedRoute element={<Manager />} />} />
              <Route path="/create-manager" element={<ProtectedRoute element={<CreateManager />} />} />
              <Route path="/edit-manager/:managerId" element={<ProtectedRoute element={<EditManager />} />} />
            </Routes>
          </div>
        </div>
      </Router>
    </WebSocketProvider>
  );
}

// Define the Logout component
const Logout = ({ setToken }) => {
  const navigate = useNavigate();

  useEffect(() => {
    setToken(null);
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setToken, navigate]);

  return <div>👋 Thank you! See you back soon.</div>;
};

export default App;
