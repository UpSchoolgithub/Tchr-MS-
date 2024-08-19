import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TeacherAuthProvider, { useTeacherAuth } from './context/TeacherAuthContext';
import { WebSocketProvider } from './WebSocketContext';

function App() {
  return (
    <TeacherAuthProvider>
      <InnerApp />
    </TeacherAuthProvider>
  );
}

function InnerApp() {
  const { token } = useTeacherAuth(); // Now this works because it's inside the TeacherAuthProvider

  return (
    <WebSocketProvider token={token}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
}

export default App;
