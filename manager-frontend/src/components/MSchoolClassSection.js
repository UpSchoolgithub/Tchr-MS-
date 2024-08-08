import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionName } = useParams();
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [assignedPeriods, setAssignedPeriods] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [combinedSectionId, setCombinedSectionId] = useState('');
  const [isEditWarningOpen, setIsEditWarningOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReloadButton, setShowReloadButton] = useState(false);
  const [schoolName, setSchoolName] = useState('');

  const [teacherFilter, setTeacherFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    const storedSubjects = JSON.parse(localStorage.getItem('selectedSubjects'));
    if (storedSubjects) {
      setSubjects(storedSubjects);
    }
    const combinedId = `${schoolId}-${classId}-${sectionName}`;
    setCombinedSectionId(combinedId);
    fetchCalendarEventsAndHolidays(schoolId);
    fetchTeachers(schoolId);
    fetchTimetableSettings(schoolId);
  }, [schoolId, sectionName]);

  useEffect(() => {
    if (teachers.length > 0 && timetableSettings) {
      fetchAssignments();
    }
  }, [teachers, timetableSettings, combinedSectionId]);

  useEffect(() => {
    // Fetch the school name based on schoolId
    axiosInstance.get(`/schools/${schoolId}`)
      .then(response => {
        setSchoolName(response.data.name); // Assuming the response has a `name` field
      })
      .catch(error => {
        console.error('Error fetching school name:', error);
      });
  }, [schoolId]);
  
  const fetchCalendarEventsAndHolidays = async (schoolId) => {
    try {
      const eventsResponse = await axiosInstance.get(`/schools/${schoolId}/calendar`);
      const holidaysResponse = await axiosInstance.get(`/schools/${schoolId}/holidays`);
      setCalendarEvents(eventsResponse.data);
      setHolidays(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching calendar events and holidays:', error);
    }
  };

  const fetchTeachers = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchTimetableSettings = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      setTimetableSettings(response.data);
    } catch (error) {
      setError('Error fetching timetable settings.');
      console.error('Error fetching timetable settings:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionName}/assignments`);
      const assignments = response.data.reduce((acc, entry) => {
        const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown Teacher' };
        const subject = subjects.find(s => s.id === entry.subjectId) || { subjectName: 'Unknown Subject' };
        acc[`${entry.day}-${entry.period}`] = {
          teacher: teacher.name,
          teacherId: entry.teacherId,
          subject: subject.subjectName,
          subjectId: entry.subjectId
        };
        return acc;
      }, {});
      setAssignedPeriods(assignments);
    } catch (error) {
      setError('Error fetching assignments.');
      console.error('Error fetching assignments:', error);
    }
  };

  const handleOpenModal = (day, period) => {
    const existingAssignment = assignedPeriods[`${day}-${period}`];
    if (existingAssignment) {
      setSelectedTeacher(existingAssignment.teacherId);
      setSelectedSubject(existingAssignment.subjectId);
      setIsEditWarningOpen(true);
    } else {
      setSelectedPeriod({ day, period });
      setSelectedTeacher('');
      setSelectedSubject('');
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseEditWarning = () => {
    setIsEditWarningOpen(false);
  };

  const handleEditConfirmed = () => {
    setIsModalOpen(true);
    setIsEditWarningOpen(false);
  };

  const handleAssignPeriod = async (e) => {
    e.preventDefault();
    try {
        const requestData = {
            schoolId,
            classId,
            combinedSectionId,
            teacherId: selectedTeacher,
            subjectId: selectedSubject,
            period: selectedPeriod.period,
            day: selectedPeriod.day,
        };

        await axiosInstance.post(`/timetable/assign`, requestData);

        const teacher = teachers.find(t => t.id === selectedTeacher) || { name: 'Unknown Teacher' };
        const subject = subjects.find(s => s.id === selectedSubject) || { subjectName: 'Unknown Subject' };

        const newAssignedPeriod = {
            teacher: teacher.name,
            teacherId: selectedTeacher,
            subject: subject.subjectName,
            subjectId: selectedSubject
        };

        setAssignedPeriods(prevAssignedPeriods => ({
            ...prevAssignedPeriods,
            [`${selectedPeriod.day}-${selectedPeriod.period}`]: newAssignedPeriod
        }));

        setIsModalOpen(false);
        setSuccessMessage('Assignment added successfully!');

        // Optionally, you can trigger a function to fetch all assignments again if necessary,
        // or just update the local state as shown above.

    } catch (error) {
        console.error('Error assigning period:', error.response || error);
        setError('Failed to assign period. Please try again.');
        // Optionally update or reset some states here if needed
    }
};


const handleReload = () => {
  // Reset specific states or fetch data again if needed
  fetchAssignments(); // Example function to re-fetch timetable data
};


  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleShowCalendar = () => {
    setShowCalendar(true);
    setShowTimetable(false);
  };

  const handleShowTimetable = () => {
    setShowTimetable(true);
    setShowCalendar(false);
  };

  const handleTeacherFilterChange = (e) => {
    setTeacherFilter(e.target.value);
  };

  const handleSubjectFilterChange = (e) => {
    setSubjectFilter(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <select onChange={handleTeacherFilterChange} value={teacherFilter}>
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
            <select onChange={handleSubjectFilterChange} value={subjectFilter}>
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

  const downloadTimetableAsPDF = () => {
    const doc = new jsPDF();

    // Ensure schoolName is used properly
    const logo = '/Upschool_2x.png';
    const logoWidth = 35;
    const logoHeight = 15;
    const logoXPosition = doc.internal.pageSize.getWidth() - logoWidth - 10;
    const logoYPosition = 10;

    doc.addImage(logo, 'PNG', logoXPosition, logoYPosition, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    const headingText = `Timetable of Class: ${classId}, Section: ${sectionName}`;
    doc.setFontSize(14);
    doc.text(headingText, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

    const startY = 45;
    const columns = ['Day / Period', '1', '2', '3', '4', '5'];
    const rows = [
      ['Monday', '', '', '', '', ''],
      ['Tuesday', '', '', '', '', ''],
      ['Wednesday', '', '', '', '', ''],
      ['Thursday', '', '', '', '', ''],
      ['Friday', '', '', '', '', ''],
      ['Saturday', '', '', '', '', '']
    ];

    doc.autoTable({
      startY: startY,
      head: [columns],
      body: rows,
      theme: 'grid'
    });

    const filename = `Timetable_${classId}_${sectionName}.pdf`;
    doc.save(filename);
  };

  



return (
  <div className="container">
    <div className="header">
      <button className="more-details-button" onClick={() => setShowDetails(!showDetails)}>
        {showDetails ? 'Hide Details' : 'More Details'}
      </button>
    </div>
    {showDetails && (
      <div className="details-section">
        <div className="details">
          <h3>Class and Section Details</h3>
          <p>School ID: {schoolId}</p>
          <p>Class ID: {classId}</p>
          <p>Section Name: {sectionName}</p>
        </div>
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
      </div>
    )}
    <div className="buttons">
      <button onClick={handleShowCalendar}>School Calendar</button>
      <button onClick={handleShowTimetable}>Timetable</button>
    </div>
    {successMessage && <div className="success-message">{successMessage}</div>}
    {error && <div className="error-message">{error}</div>}
    {showCalendar && (
      <div className="calendar">
        <h2>School Calendar Events</h2>
        <label>
          Filter:
          <select onChange={handleFilterChange} value={filter}>
            <option value="all">All</option>
            <option value="events">Events</option>
            <option value="holidays">Holidays</option>
          </select>
        </label>
        <div className="events">
          {filteredList.length > 0 ? (
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.eventName || item.name}</td>
                    <td>{formatDate(item.date || item.startDate)}</td>
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

    {/* Modal for assigning period */}
    <Modal isOpen={isModalOpen} onRequestClose={handleCloseModal}>
      <h2>Assign Period</h2>
      <form onSubmit={handleAssignPeriod}>
        <div>
          <label>Teacher:</label>
          <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required>
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Subject:</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
            <option value="">Select a subject</option>
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))
            ) : (
              <option disabled>No subjects available</option>
            )}
          </select>
        </div>
        <button type="submit">Assign</button>
        <button type="button" onClick={handleCloseModal}>Cancel</button>
      </form>
      
      {/* Reload Button */}
      {showReloadButton && (
        <button onClick={handleReload} className="reload-button">
          Reload Page
        </button>
      )}
    </Modal>

    {/* Modal for edit warning */}
    <Modal isOpen={isEditWarningOpen} onRequestClose={handleCloseEditWarning}>
      <h2>Warning</h2>
      <p>This period already has an assigned teacher and subject. Are you sure you want to edit it?</p>
      <button onClick={handleEditConfirmed}>Yes</button>
      <button onClick={handleCloseEditWarning}>No</button>
    </Modal>
  </div>
);
};

export default MSchoolClassSection;
