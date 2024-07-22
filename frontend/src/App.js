import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const ProtectedRoute = ({ element }) => {
    return token ? element : <Navigate to="/login" />;
  };

  return (
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
            <Route path="/edit-school/:id" element={<ProtectedRoute element={<EditSchool />} />}>
              <Route path="details" element={<ProtectedRoute element={<SchoolDetails />} />} />
              <Route path="timetable" element={<ProtectedRoute element={<TimetableSettings />} />} />
              <Route path="calendar" element={<ProtectedRoute element={<SchoolCalendar />} />} />
              <Route path="classes" element={<ProtectedRoute element={<ClassInfo />} />} />
              <Route path="members" element={<ProtectedRoute element={<Members />} />} />
            </Route>
            <Route path="/schools/:schoolId/*" element={<ProtectedRoute element={<SchoolPage />} />}>
              <Route path="classes/:classId/sections/:sectionId/sessions" element={<ProtectedRoute element={<SessionManagement />} />} />
            </Route>
            <Route path="/sessions/:sessionId/sessionPlans" element={<ProtectedRoute element={<SessionPlan />} />} />
            <Route path="/add-section" element={<ProtectedRoute element={<AddSection />} />} />
            {/* Add the logout route */}
            <Route path="/logout" element={<Logout setToken={setToken} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// Define the Logout component
const Logout = ({ setToken }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear the token
    setToken(null);
    // Set a timeout to navigate to login page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    // Cleanup the timeout if the component unmounts before the timer finishes
    return () => clearTimeout(timer);
  }, [setToken, navigate]);

  return <div>👋 Thank you! See you back soon.</div>;
};

export default App;
