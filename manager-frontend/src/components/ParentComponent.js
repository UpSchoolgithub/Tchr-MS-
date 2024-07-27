import React from 'react';
import MTimetable from './MTimetable';

const ParentComponent = () => {
  const schoolId = 1;
  const classId = 1;
  const sectionId = 42; // Ensure this is a valid number
  const subjects = [
    { id: 1, subjectName: 'Math' },
    { id: 2, subjectName: 'Science' }
  ];

  console.log('sectionId being passed:', sectionId); // Log the sectionId to ensure it's correct

  return (
    <div>
      <h1>School Timetable</h1>
      <MTimetable
        schoolId={schoolId}
        classId={classId}
        sectionId={sectionId} // Ensure this is a valid number
        subjects={subjects}
      />
    </div>
  );
};

export default ParentComponent;
