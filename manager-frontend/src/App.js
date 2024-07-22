// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import MTimetable from './components/MTimetable';
import StudentTable from './components/StudentTable'; // Import the new component
import { ManagerAuthProvider, useManagerAuth } from './context/ManagerAuthContext';

function App() {
  const { token } = useManagerAuth();

  const ProtectedRoute = ({ element }) => {
    return token ? element : <Navigate to="/mlogin" />;
  };

  return (
    <ManagerAuthProvider>
      <Router>
        <div className="app">
          {token && <MSidebar />}
          <div className="main-content">
            <Routes>
              <Route path="/mlogin" element={<MLoginForm />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<MDashboard />} />} />
              <Route path="/classroom" element={<ProtectedRoute element={<MClassroom />} />} />
              <Route path="/view-teachers" element={<ProtectedRoute element={<MViewTeachers />} />} />
              <Route path="/request" element={<ProtectedRoute element={<MRequest />} />} />
              <Route path="/view-activities" element={<ProtectedRoute element={<MViewActivities />} />} />
              <Route path="/dashboard/school/:schoolId/class/:classId/section/:sectionId" element={<ProtectedRoute element={<MSchoolClassSection />} />} />
              <Route path="/teachers" element={<ProtectedRoute element={<TeacherList />} />} />
              <Route path="/teachers/create" element={<ProtectedRoute element={<CreateTeacher />} />} />
              <Route path="/teachers/edit/:id" element={<ProtectedRoute element={<EditTeacher />} />} />
              <Route path="/timetable" element={<ProtectedRoute element={<MTimetable />} />} />
              <Route path="/students" element={<ProtectedRoute element={<StudentTable />} />} /> {/* Add this route */}
            </Routes>
          </div>
        </div>
      </Router>
    </ManagerAuthProvider>
  );
}

export default App;
