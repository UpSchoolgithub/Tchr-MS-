import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TeacherAuthProvider, { useTeacherAuth } from './context/TeacherAuthContext';
import { WebSocketProvider } from './WebSocketContext';

function App() {
  const { token } = useTeacherAuth(); // Assuming you get the token from the TeacherAuthContext

  return (
    <TeacherAuthProvider>
      <WebSocketProvider token={token}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </TeacherAuthProvider>
  );
}

export default App;
