import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';
import PeriodAssignmentForm from './PeriodAssignmentForm';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionName } = useParams();
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [assignedPeriods, setAssignedPeriods] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [isEditWarningOpen, setIsEditWarningOpen] = useState(false);
  const [error, setError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false); // Initialize showCalendar state
  const [showTimetable, setShowTimetable] = useState(false); // Initialize showTimetable state
  const [showDetails, setShowDetails] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [filter, setFilter] = useState('all'); // Initialize filter state

  useEffect(() => {
    const storedSubjects = JSON.parse(localStorage.getItem('selectedSubjects'));
    if (storedSubjects) {
      setSubjects(storedSubjects);
    }
    fetchInitialData();
  }, [schoolId, classId, sectionName]);

  useEffect(() => {
    if (teachers.length > 0 && timetableSettings) {
      fetchAssignments();
    }
  }, [teachers, timetableSettings, schoolId, classId, sectionName]);

  const fetchInitialData = async () => {
    try {
      await fetchCalendarEventsAndHolidays();
      await fetchTeachers();
      await fetchTimetableSettings();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchCalendarEventsAndHolidays = async () => {
    try {
      const eventsResponse = await axiosInstance.get(`/schools/${schoolId}/calendar`);
      const holidaysResponse = await axiosInstance.get(`/schools/${schoolId}/holidays`);
      setCalendarEvents(eventsResponse.data);
      setHolidays(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching calendar events and holidays:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchTimetableSettings = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      setTimetableSettings(response.data);
    } catch (error) {
      console.error('Error fetching timetable settings:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionName}/assignments`);
      const assignments = processAssignments(response.data);
      setAssignedPeriods(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const processAssignments = (data) => {
    return data.reduce((acc, entry) => {
      const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown' };
      const subject = subjects.find(s => s.id === entry.subjectId) || { subjectName: 'Unknown' };
      acc[`${entry.day}-${entry.period}`] = {
        teacher: teacher.name,
        teacherId: entry.teacherId,
        subject: subject.subjectName,
        subjectId: entry.subjectId
      };
      return acc;
    }, {});
  };

  const handleOpenModal = (day, period) => {
    setSelectedPeriod({ day, period });
    setIsModalOpen(true);
  };

  const handleAssignPeriod = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        schoolId,
        classId,
        sectionName,
        day: selectedPeriod.day,
        period: selectedPeriod.period,
        teacherId: selectedTeacher,
        subjectId: selectedSubject
      };
      await axiosInstance.post('/timetable/assign', requestData);
      fetchAssignments();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error assigning period:', error);
    }
  };

  const downloadTimetableAsPDF = () => {
    const doc = new jsPDF();
    const columns = ['Day / Period', ...Array.from({ length: timetableSettings.periodsPerDay }, (_, i) => i + 1)];
    const rows = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
      const row = [day];
      Array.from({ length: timetableSettings.periodsPerDay }, (_, i) => i + 1).forEach(period => {
        const periodAssignment = assignedPeriods[`${day}-${period}`];
        const teacherMatch = teacherFilter ? periodAssignment?.teacher === teacherFilter : true;
        const subjectMatch = subjectFilter ? periodAssignment?.subject === subjectFilter : true;

        if (teacherMatch && subjectMatch) {
          row.push(periodAssignment ? `${periodAssignment.teacher}\n${periodAssignment.subject}` : '');
        } else {
          row.push('');
        }
      });
      return row;
    });

    doc.autoTable({
      head: [columns],
      body: rows,
    });

    doc.save('timetable.pdf');
  };

  const combinedList = [...calendarEvents, ...holidays].sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));

  const filteredList = combinedList.filter((item) => {
    if (filter === 'events') return item.eventName;
    if (filter === 'holidays') return item.name;
    return true;
  });

  const renderTable = () => {
    if (!timetableSettings) return null;

    const periods = Array.from({ length: timetableSettings.periodsPerDay }, (_, i) => i + 1);

    return (
      <div>
        <div className="filters">
          <label>
            Filter by Teacher:
            <select onChange={(e) => setTeacherFilter(e.target.value)} value={teacherFilter}>
              <option value="">All</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Filter by Subject:
            <select onChange={(e) => setSubjectFilter(e.target.value)} value={subjectFilter}>
              <option value="">All</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.subjectName}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </label>
          <button onClick={downloadTimetableAsPDF}>Download Timetable as PDF</button>
        </div>
        <table className="timetable-table">
          <thead>
            <tr>
              <th>Day / Period</th>
              {periods.map(period => (
                <th key={period}>{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <tr key={day}>
                <td>{day}</td>
                {periods.map(period => {
                  const periodAssignment = assignedPeriods[`${day}-${period}`];
                  const teacherMatch = teacherFilter ? periodAssignment?.teacher === teacherFilter : true;
                  const subjectMatch = subjectFilter ? periodAssignment?.subject === subjectFilter : true;

                  if (teacherMatch && subjectMatch) {
                    return (
                      <td key={period} onClick={() => handleOpenModal(day, period)}>
                        {periodAssignment ? (
                          <>
                            <div>{periodAssignment.teacher}</div>
                            <div>{periodAssignment.subject}</div>
                          </>
                        ) : (
                          <span className="add-icon">+</span>
                        )}
                      </td>
                    );
                  }
                  return <td key={period} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Class and Section Details</h1>
        <button className="details-button" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        <button className="details-button" onClick={() => setShowSubjects(!showSubjects)}>
          {showSubjects ? 'Hide Subjects' : 'Show Subjects'}
        </button>
      </div>
      {showDetails && (
        <div className="details">
          <p>School ID: {schoolId}</p>
          <p>Class ID: {classId}</p>
          <p>Section Name: {sectionName}</p>
        </div>
      )}
      {showSubjects && (
        <div className="subjects">
          <h3>Subjects:</h3>
          {subjects.length > 0 ? (
            subjects.map(subject => (
              <div key={subject.id} className="subject">
                <span>{subject.subjectName || 'No Subject Name'}</span>
              </div>
            ))
          ) : (
            <p>No subjects found for this section.</p>
          )}
        </div>
      )}
      <div className="buttons">
        <button onClick={() => setShowCalendar(true)}>School Calendar</button>
        <button onClick={() => setShowTimetable(true)}>Timetable</button>
      </div>
      {showCalendar && (
        <div className="calendar">
          <h2>School Calendar Events</h2>
          <label>
            Filter:
            <select onChange={(e) => setFilter(e.target.value)} value={filter}>
              <option value="all">All</option>
              <option value="events">Events</option>
              <option value="holidays">Holidays</option>
            </select>
          </label>
          <div className="events">
            {calendarEvents.length > 0 || holidays.length > 0 ? (
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...calendarEvents, ...holidays].map((item) => (
                    <tr key={item.id}>
                      <td>{item.eventName || item.name}</td>
                      <td>{new Date(item.date || item.startDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No events found for this school.</p>
            )}
          </div>
        </div>
      )}
      {showTimetable && (
        <div className="timetable">
          <h2>School Timetable</h2>
          {renderTable()}
        </div>
      )}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <h2>Assign Period</h2>
        <PeriodAssignmentForm
          teachers={teachers}
          subjects={subjects}
          onAssign={handleAssignPeriod}
          selectedTeacher={selectedTeacher}
          setSelectedTeacher={setSelectedTeacher}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      </Modal>
    </div>
  );
};

export default MSchoolClassSection;
