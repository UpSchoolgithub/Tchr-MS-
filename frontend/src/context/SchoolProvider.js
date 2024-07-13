import React from 'react';
import { SchoolProvider } from '../components/SchoolContext';
import YourComponent from './YourComponent'; // Import your main component

function App() {
  return (
    <SchoolProvider>
      <YourComponent />
    </SchoolProvider>
  );
}

export default App;
