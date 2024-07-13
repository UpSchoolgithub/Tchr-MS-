import React from 'react';
import SchoolDetails from './SchoolDetails';

const ParentComponent = () => {
  const handleSuccess = (data) => {
    console.log('School created successfully:', data);
    // Handle success logic here, e.g., update state or navigate to another page
  };

  return (
    <div>
      <h1>Create a New School</h1>
      <SchoolDetails onSuccess={handleSuccess} />
    </div>
  );
};

export default ParentComponent;
