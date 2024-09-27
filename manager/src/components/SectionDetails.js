import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SchoolCalendar from './SchoolCalendar';
import MTimetable from './MTimetable';
import StudentDetails from './StudentDetails';
import Attendance from './Attendance';
import Assignments from './Assignments';
import Tests from './Tests';
import PersonalDetails from './PersonalDetails';

const SectionDetails = () => {
  const { state } = useLocation();
  const { selectedSchool, selectedClass, selectedSection, subjects } = state || {};
  const [activeTab, setActiveTab] = useState('details');
  const [activeStudentTab, setActiveStudentTab] = useState('attendance');
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleStudentTabClick = (tab) => {
    setActiveStudentTab(tab);
  };

  const handleStudentUpload = (uploadedStudents) => {
    setStudents(uploadedStudents);
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
        <button onClick={() => handleTabClick('students')}>Students</button>
      </div>
      <div>
        {activeTab === 'timetable' && <MTimetable schoolId={selectedSchool} classId={selectedClass} sectionId={selectedSection} subjects={subjects} />}
        {activeTab === 'calendar' && <SchoolCalendar schoolId={selectedSchool} />}
        {activeTab === 'students' && (
          <div>
            {students.length === 0 && <StudentDetails schoolId={selectedSchool} classId={selectedClass} sectionId={selectedSection} onUpload={handleStudentUpload} />}
            {students.length > 0 && (
              <div>
                <div>
                  <button onClick={() => handleStudentTabClick('attendance')}>Attendance</button>
                  <button onClick={() => handleStudentTabClick('assignments')}>Assignments</button>
                  <button onClick={() => handleStudentTabClick('tests')}>Tests</button>
                  <button onClick={() => handleStudentTabClick('personalDetails')}>Personal Details</button>
                </div>
                <div>
                  {activeStudentTab === 'attendance' && <Attendance students={students} />}
                  {activeStudentTab === 'assignments' && <Assignments students={students} />}
                  {activeStudentTab === 'tests' && <Tests students={students} />}
                  {activeStudentTab === 'personalDetails' && <PersonalDetails students={students} />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionDetails;
