// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ManagerAuthProvider } from './context/ManagerAuthContext';
import Modal from 'react-modal';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// Set the app element for the modal
Modal.setAppElement(rootElement);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

root.render(
  <React.StrictMode>
    <ManagerAuthProvider>
      <App />
    </ManagerAuthProvider>
  </React.StrictMode>
);
