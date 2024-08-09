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
  const [showTimetable, setShowTimetable] = useState(
    () => JSON.parse(localStorage.getItem('showTimetable')) || false
  );
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
    axiosInstance.get(`/schools/${schoolId}`)
      .then(response => {
        setSchoolName(response.data.name);
      })
      .catch(error => {
        console.error('Error fetching school name:', error);
      });
  }, [schoolId]);
  
  useEffect(() => {
    localStorage.setItem('showTimetable', JSON.stringify(showTimetable));
  }, [showTimetable]);

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
      console.log('Timetable Settings Response:', response.data); // Log the response
      setTimetableSettings(response.data);
    } catch (error) {
      setError('Error fetching timetable settings.');
      console.error('Error fetching timetable settings:', error);
    }
  };

  useEffect(() => {
    if (timetableSettings && !timetableSettings.periodTimings) {
      generatePeriodTimings();
    }
  }, [timetableSettings]);

  const generatePeriodTimings = () => {
    const { periodsPerDay, durationPerPeriod, schoolStartTime } = timetableSettings;
    const periodTimings = [];
    let startTime = new Date(`1970-01-01T${schoolStartTime}`);
    
    for (let i = 0; i < periodsPerDay; i++) {
      const endTime = new Date(startTime.getTime() + durationPerPeriod * 60000);
      periodTimings.push(`${formatTime(startTime)} - ${formatTime(endTime)}`);
      startTime = endTime; // Move to the next period's start time
    }

    setTimetableSettings((prevSettings) => ({
      ...prevSettings,
      periodTimings,
    }));
  };

  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5); // Format time as HH:MM
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
      setShowReloadButton(true);
  
    } catch (error) {
      console.error('Error assigning period:', error.response || error);
      if (error.response) {
        console.log('Response Data:', error.response.data);
        console.log('Response Status:', error.response.status);
        console.log('Response Headers:', error.response.headers);
      }
      setError('Failed to assign period. Please try again.');
    }
  };

  const handleReload = () => {
    navigate(0);
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
    console.log('Timetable Settings:', timetableSettings); // Log the timetable settings
    if (!timetableSettings || !timetableSettings.periodTimings || timetableSettings.periodTimings.length === 0) {
      return <p>No timetable settings available</p>;
    }

    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Period / Time</th>
            {days.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, index) => (
            <tr key={period}>
              <td>
                Period {period} <br /> 
                {timetableSettings.periodTimings[index] || ''}
              </td>
              {days.map(day => {
                const startEndTime = timetableSettings.periodTimings ? timetableSettings.periodTimings[index] : undefined;
                if (startEndTime) {
                  const [start, end] = startEndTime.split(' - ');
                  if (timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime &&
                      new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.shortBreak1StartTime}:00`) &&
                      new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.shortBreak1EndTime}:00`)) {
                    return <td key={`${day}-${period}`} className="break">Short Break 1</td>;
                  }
                  if (timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime &&
                      new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.shortBreak2StartTime}:00`) &&
                      new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.shortBreak2EndTime}:00`)) {
                    return <td key={`${day}-${period}`} className="break">Short Break 2</td>;
                  }
                  if (timetableSettings.lunchStartTime && timetableSettings.lunchEndTime &&
                      new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.lunchStartTime}:00`) &&
                      new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.lunchEndTime}:00`)) {
                    return <td key={`${day}-${period}`} className="lunch">Lunch Break</td>;
                  }
                }

                const periodAssignment = assignedPeriods ? assignedPeriods[`${day}-${period}`] : undefined;
                return (
                  <td key={`${day}-${period}`} onClick={() => handleOpenModal(day, period)}>
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
              })}
            </tr>
          ))}
          {timetableSettings.shortBreak1StartTime && (
            <tr>
              <td colSpan={days.length + 1} className="break">SHORT BREAK 1 <br/> {timetableSettings.shortBreak1StartTime} - {timetableSettings.shortBreak1EndTime}</td>
            </tr>
          )}
          {timetableSettings.lunchStartTime && (
            <tr>
              <td colSpan={days.length + 1} className="lunch">LUNCH <br/> {timetableSettings.lunchStartTime} - {timetableSettings.lunchEndTime}</td>
            </tr>
          )}
          {timetableSettings.shortBreak2StartTime && (
            <tr>
              <td colSpan={days.length + 1} className="break">SHORT BREAK 2 <br/> {timetableSettings.shortBreak2StartTime} - {timetableSettings.shortBreak2EndTime}</td>
            </tr>
          )}
          {timetableSettings.reserveTimeStart && (
            <tr>
              <td colSpan={days.length + 1} className="reserve">RESERVED TIME <br/> {timetableSettings.reserveTimeStart} - {timetableSettings.reserveTimeEnd}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const downloadTimetableAsPDF = () => {
    if (!timetableSettings || !timetableSettings.periodTimings || timetableSettings.periodTimings.length === 0) {
      alert('No timetable settings available to download.');
      return;
    }
  
    const doc = new jsPDF();
  
    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
    const rows = [];
  
    periods.forEach((period, index) => {
      const startEndTime = timetableSettings.periodTimings[index];
      const row = [`Period ${period} (${startEndTime})`];
  
      days.forEach(day => {
        if (startEndTime) {
          const [start, end] = startEndTime.split(' - ');
  
          if (timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime &&
              new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.shortBreak1StartTime}:00`) &&
              new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.shortBreak1EndTime}:00`)) {
            row.push('SHORT BREAK 1');
          } else if (timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime &&
                     new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.shortBreak2StartTime}:00`) &&
                     new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.shortBreak2EndTime}:00`)) {
            row.push('SHORT BREAK 2');
          } else if (timetableSettings.lunchStartTime && timetableSettings.lunchEndTime &&
                     new Date(`1970-01-01T${start}:00`) >= new Date(`1970-01-01T${timetableSettings.lunchStartTime}:00`) &&
                     new Date(`1970-01-01T${end}:00`) <= new Date(`1970-01-01T${timetableSettings.lunchEndTime}:00`)) {
            row.push('LUNCH');
          } else {
            const periodAssignment = assignedPeriods[`${day}-${period}`];
            const entry = periodAssignment ? `${periodAssignment.teacher}\n${periodAssignment.subject}` : '';
            row.push(entry);
          }
        }
      });
  
      rows.push(row);
    });
  
    // Add rows for breaks and reserved time
    if (timetableSettings.shortBreak1StartTime) {
      rows.push(['SHORT BREAK 1', '', '', '', '', '']);
    }
    if (timetableSettings.lunchStartTime) {
      rows.push(['LUNCH', '', '', '', '', '']);
    }
    if (timetableSettings.shortBreak2StartTime) {
      rows.push(['SHORT BREAK 2', '', '', '', '', '']);
    }
    rows.push(['RESERVED TIME', '', '', '', '', '']);
  
    const columns = ['Period / Time', ...days];
  
    // Set up custom styles
    const headerStyles = {
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    };
  
    const breakStyles = {
      fillColor: [189, 195, 199],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    };
  
    // Add school name
    doc.setFontSize(16);
    doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
    const headingText = `Timetable of Class: ${classId}, Section: ${sectionName}`;
    doc.setFontSize(14);
    doc.text(headingText, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
    // Create the table
    doc.autoTable({
      startY: 40,
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: {
        halign: 'center',
        valign: 'middle',
      },
      headStyles: headerStyles,
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      rowPageBreak: 'avoid',
      willDrawCell: function (data) {
        // Apply styles for breaks
        if (data.row.index === rows.length - 4 && timetableSettings.shortBreak1StartTime) {
          data.cell.styles = breakStyles;
        }
        if (data.row.index === rows.length - 3 && timetableSettings.lunchStartTime) {
          data.cell.styles = breakStyles;
        }
        if (data.row.index === rows.length - 2 && timetableSettings.shortBreak2StartTime) {
          data.cell.styles = breakStyles;
        }
        if (data.row.index === rows.length - 1) {
          data.cell.styles = breakStyles;
        }
      },
    });
  
    const filename = `Timetable_${classId}_${sectionName}.pdf`;
    doc.save(filename);
  };
  
  return (
    <div className="container">
      <div className="header">
        <h1>{schoolName}</h1>
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
        <button onClick={downloadTimetableAsPDF}>Download Timetable as PDF</button>
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

        {showReloadButton && (
          <button onClick={handleReload} className="reload-button">
            Reload Page
          </button>
        )}
      </Modal>

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
