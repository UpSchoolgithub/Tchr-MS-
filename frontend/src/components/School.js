import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SchoolDetails from './SchoolDetails';
import TimetableSettings from './TimetableSettings';
import SchoolCalendar from './SchoolCalendar';
import ClassInfo from './ClassInfo';
import Members from './Members';
import '../styles.css';

const School = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('SchoolDetails');
  const [isSchoolSaved, setIsSchoolSaved] = useState(!!id);
  const [schoolId, setSchoolId] = useState(id);
  const [schoolDetails, setSchoolDetails] = useState(null);

  useEffect(() => {
    if (schoolId) {
      fetch(`/api/schools/${schoolId}`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              // If the school is not found, redirect to the school list page
              navigate('/CreateSchool');
            }
            throw new Error('Error fetching school details');
          }
          return response.json();
        })
        .then(data => setSchoolDetails(data))
        .catch(error => console.error('Error fetching school details:', error));
    }
  }, [schoolId, navigate]);

  const handleSchoolSaved = (id) => {
    setIsSchoolSaved(true);
    setSchoolId(id);
    navigate('/CreateSchool'); // Redirect to the school list page after saving
  };

  const handleTabClick = (tab) => {
    if (!isSchoolSaved && tab !== 'SchoolDetails') {
      alert('Please fill in the school details and save them before proceeding.');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div>
      <div className="tabs">
        <button
          id="SchoolDetails"
          className={`tab-button ${activeTab === 'SchoolDetails' ? 'active' : ''}`}
          onClick={() => handleTabClick('SchoolDetails')}
        >
          School Details
        </button>
        <button
          id="TimetableSettings"
          className={`tab-button ${activeTab === 'TimetableSettings' ? 'active' : ''}`}
          onClick={() => handleTabClick('TimetableSettings')}
          disabled={!isSchoolSaved}
        >
          Timetable Settings
        </button>
        <button
          id="SchoolCalendar"
          className={`tab-button ${activeTab === 'SchoolCalendar' ? 'active' : ''}`}
          onClick={() => handleTabClick('SchoolCalendar')}
          disabled={!isSchoolSaved}
        >
          School Calendar
        </button>
        <button
          id="ClassInfo"
          className={`tab-button ${activeTab === 'ClassInfo' ? 'active' : ''}`}
          onClick={() => handleTabClick('ClassInfo')}
          disabled={!isSchoolSaved}
        >
          Class
        </button>
        <button
          id="Members"
          className={`tab-button ${activeTab === 'Members' ? 'active' : ''}`}
          onClick={() => handleTabClick('Members')}
          disabled={!isSchoolSaved}
        >
          Members
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'SchoolDetails' && <SchoolDetails onSave={handleSchoolSaved} schoolId={schoolId} />}
        {activeTab === 'TimetableSettings' && <TimetableSettings schoolId={schoolId} />}
        {activeTab === 'SchoolCalendar' && <SchoolCalendar schoolId={schoolId} />}
        {activeTab === 'ClassInfo' && <ClassInfo schoolId={schoolId} />}
        {activeTab === 'Members' && <Members schoolId={schoolId} />}
      </div>
    </div>
  );
};

export default School;
