import React from 'react';
import { useLocation } from 'react-router-dom';

const LessonPlanForm = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const schoolId = queryParams.get('schoolId');

  return (
    <div>
      <h1>Lesson Plan Form</h1>
      <p>Selected School ID: {schoolId}</p>
      {/* Add your form fields and logic here */}
    </div>
  );
};

export default LessonPlanForm;
