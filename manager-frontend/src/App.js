import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { WebSocketProvider } from './WebSocketContext';
import MSidebar from './components/MSidebar';
import MLoginForm from './components/MLoginForm';
import MDashboard from './components/MDashboard';
import MClassroom from './components/MClassroom';
import MViewTeachers from './components/MViewTeachers';
import MRequest from './components/MRequest';
import MViewActivities from './components/MViewActivities';
import MSchoolClassSection from './components/MSchoolClassSection';
import TeacherList from './components/TeacherList';
import CreateTeacher from './components/CreateTeacher';
import EditTeacher from './components/EditTeacher';
import SchoolCalendar from './components/SchoolCalendar';
import TeacherTimetable from './components/TeacherTimetable';
import { ManagerAuthProvider, useManagerAuth } from './context/ManagerAuthContext';
import ProtectedRoute from './ProtectedRoute';

function App() {
  const { token } = useManagerAuth();

  return (
    <ManagerAuthProvider>
      <WebSocketProvider token={token}>
        <Router>
          <AppContent />
        </Router>
      </WebSocketProvider>
    </ManagerAuthProvider>
  );
}

function AppContent() {
  const { token, setAuthToken } = useManagerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token from localStorage to maintain session
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    setLoading(false);
  }, [setAuthToken]);

  useEffect(() => {
    // Redirect to login page if not authenticated and not already on login page
    if (!token && !loading && location.pathname !== '/mlogin') {
      navigate('/mlogin', { replace: true });
    }
  }, [token, loading, location.pathname, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      {token && <MSidebar />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/mlogin'} replace />} />
          <Route path="/mlogin" element={<MLoginForm />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<MDashboard />} />} />
          <Route path="/classroom" element={<ProtectedRoute element={<MClassroom />} />} />
          <Route path="/view-teachers" element={<ProtectedRoute element={<MViewTeachers />} />} />
          <Route path="/request" element={<ProtectedRoute element={<MRequest />} />} />
          <Route path="/view-activities" element={<ProtectedRoute element={<MViewActivities />} />} />
          <Route path="/dashboard/school/:schoolId/class/:classId/section/:sectionName" element={<ProtectedRoute element={<MSchoolClassSection />} />} />
          <Route path="/teachers" element={<ProtectedRoute element={<TeacherList />} />} />
          <Route path="/teachers/create" element={<ProtectedRoute element={<CreateTeacher />} />} />
          <Route path="/teachers/edit/:id" element={<ProtectedRoute element={<EditTeacher />} />} />
          <Route path="/dashboard/school/:schoolId/class/:classId/section/:sectionName/calendar" element={<ProtectedRoute element={<SchoolCalendar />} />} />

          {/* 404 Page */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
