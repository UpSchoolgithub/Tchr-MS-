import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SchoolCalendar from './SchoolCalendar';

const SectionDetails = () => {
  const { state } = useLocation();
  const { selectedSchool, selectedClass, selectedSection, subjects } = state || {};
  const [activeTab, setActiveTab] = useState('details');
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  if (!state) {
    return <div>No section selected. Please go back and select a section.</div>;
  }

  return (
    <div>
      <h1>Section Details</h1>
      <div>
        <p><strong>School:</strong> {selectedSchool}</p>
        <p><strong>Class:</strong> {selectedClass}</p>
        <p><strong>Section:</strong> {selectedSection}</p>
      </div>
      <div>
        <h3>Subjects:</h3>
        {subjects.length > 0 ? (
          subjects.map(subject => (
            <div key={subject.id}>
              <span>{subject.subjectName || 'No Subject Name'}</span>
            </div>
          ))
        ) : (
          <p>No subjects found for this section.</p>
        )}
      </div>
      <div>
        <button onClick={() => handleTabClick('timetable')}>Timetable Settings</button>
        <button onClick={() => handleTabClick('calendar')}>School Calendar</button>
      </div>
      <div>
        {activeTab === 'timetable' && <div>Timetable Settings Component Placeholder</div>}
        {activeTab === 'calendar' && <SchoolCalendar schoolId={selectedSchool} />}
      </div>
    </div>
  );
};

export default SectionDetails;
