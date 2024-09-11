import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { WebSocketProvider } from './WebSocketContext'; 
import MSidebar from './components/MSidebar';  // Ensure MSidebar is exported correctly
import MLoginForm from './components/MLoginForm';  // Ensure MLoginForm is exported correctly
import MDashboard from './components/MDashboard';  // Ensure MDashboard is exported correctly
import MClassroom from './components/MClassroom';  // Ensure MClassroom is exported correctly
import MViewTeachers from './components/MViewTeachers';  // Ensure MViewTeachers is exported correctly
import MRequest from './components/MRequest';  // Ensure MRequest is exported correctly
import MViewActivities from './components/MViewActivities';  // Ensure MViewActivities is exported correctly
import MSchoolClassSection from './components/MSchoolClassSection';  // Ensure MSchoolClassSection is exported correctly
import TeacherList from './components/TeacherList';  // Ensure TeacherList is exported correctly
import CreateTeacher from './components/CreateTeacher';  // Ensure CreateTeacher is exported correctly
import EditTeacher from './components/EditTeacher';  // Ensure EditTeacher is exported correctly
import SchoolCalendar from './components/SchoolCalendar';  // Ensure SchoolCalendar is exported correctly
import ProtectedRoute from './ProtectedRoute';  // Ensure ProtectedRoute is exported correctly
import TeacherTimetable from './components/TeacherTimetable';  // Ensure TeacherTimetable is exported correctly
import { ManagerAuthProvider, useManagerAuth } from './context/ManagerAuthContext';  // Ensure ManagerAuthProvider is exported correctly

function App() {
  const { token } = useManagerAuth();  // Access the authentication token using the context

  return (
    <ManagerAuthProvider> {/* Ensure that the provider wraps the components that use context */}
      <WebSocketProvider token={token}>
        <Router>
          <AppContent /> {/* Main application content */}
        </Router>
      </WebSocketProvider>
    </ManagerAuthProvider>
  );
}

function AppContent() {
  const { token, setAuthToken } = useManagerAuth();  // Access token and token setter from the context
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);  // State to manage loading while checking token

  useEffect(() => {
    // Load token from localStorage to maintain session
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    setLoading(false);  // Stop loading after token check
  }, [setAuthToken]);

  useEffect(() => {
    // Redirect to login page if not authenticated and not already on login page
    if (!token && !loading && location.pathname !== '/mlogin') {
      navigate('/mlogin', { replace: true });
    }
  }, [token, loading, location.pathname, navigate]);

  if (loading) {
    return <div>Loading...</div>;  // Show loading state while token is being checked
  }

  return (
    <div className="app">
      {token && <MSidebar />} {/* Show sidebar if the user is authenticated */}
      <div className="main-content">
        <Routes>
          {/* Redirect to dashboard if authenticated, otherwise to login */}
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/mlogin'} replace />} />
          
          {/* Public route for login */}
          <Route path="/mlogin" element={<MLoginForm />} />

          {/* Protected routes: Only accessible if authenticated */}
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
          <Route path="/schools/timetable/teacher/:teacherId" element={<ProtectedRoute element={<TeacherTimetable />} />} />

          {/* Fallback route for undefined paths */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
