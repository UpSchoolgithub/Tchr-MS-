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
  
    // Combine periods and breaks/lunches into a single timeline array
    const timeline = [];
  
    periods.forEach((period, index) => {
      const startEndTime = timetableSettings.periodTimings[index];
      if (typeof startEndTime === 'string') {
        const [start, end] = startEndTime.split(' - ');
  
        // Insert the period itself
        timeline.push({ type: 'period', period, time: startEndTime });
  
        // Insert Short Break 1 if it's supposed to be between periods 2 and 3
        if (index === 1 && timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime) {
          timeline.push({ type: 'break', label: 'SHORT BREAK 1', time: `${timetableSettings.shortBreak1StartTime} - ${timetableSettings.shortBreak1EndTime}` });
        }
  
        // Insert Lunch Break if it's supposed to be between periods 4 and 5
        if (index === 3 && timetableSettings.lunchStartTime && timetableSettings.lunchEndTime) {
          timeline.push({ type: 'break', label: 'LUNCH', time: `${timetableSettings.lunchStartTime} - ${timetableSettings.lunchEndTime}` });
        }
  
        // Insert Short Break 2 if it's supposed to be between periods 6 and 7
        if (index === 5 && timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime) {
          timeline.push({ type: 'break', label: 'SHORT BREAK 2', time: `${timetableSettings.shortBreak2StartTime} - ${timetableSettings.shortBreak2EndTime}` });
        }
      } else {
        console.error('Invalid startEndTime format:', startEndTime);
      }
    });
  
    // Insert reserved time if set and it falls after all periods
    if (timetableSettings.reserveTimeStart && timetableSettings.reserveTimeEnd) {
      timeline.push({ type: 'reserved', label: 'RESERVED TIME', time: `${timetableSettings.reserveTimeStart} - ${timetableSettings.reserveTimeEnd}` });
    }
  
    console.log('Timeline:', timeline); // Log the generated timeline
  
    return (
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Time</th>
            {days.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeline.map((entry, index) => (
            <tr key={index}>
              <td>
                {entry.type === 'period' ? `Period ${entry.period}` : entry.label} <br />
                {entry.time}
              </td>
              {days.map(day => {
                if (entry.type === 'period') {
                  const periodAssignment = assignedPeriods ? assignedPeriods[`${day}-${entry.period}`] : undefined;
                  return (
                    <td key={`${day}-${index}`} onClick={() => handleOpenModal(day, entry.period)}>
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
                return <td key={`${day}-${index}`} className="break"></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  

  const downloadTimetableAsPDF = () => {
    if (!timetableSettings || !timetableSettings.periodTimings || timetableSettings.periodTimings.length === 0) {
      alert('No timetable settings available to download.');
      return;
    }
  
    const doc = new jsPDF('p', 'mm', 'a4'); // Portrait mode with A4 size
  
    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; // Days names as in the webpage
  
    const rows = [];
    const timeline = [];
  
    // Build the timeline with periods and breaks
    periods.forEach((period, index) => {
      const startEndTime = timetableSettings.periodTimings[index];
      if (startEndTime) {
        // Insert the period itself
        timeline.push({ type: 'period', period, time: startEndTime });
  
        // Insert Short Break 1 if it's supposed to be between periods 2 and 3
        if (index === 1 && timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime) {
          timeline.push({ type: 'break', label: 'SHORT BREAK 1', time: `${timetableSettings.shortBreak1StartTime} - ${timetableSettings.shortBreak1EndTime}` });
        }
  
        // Insert Lunch Break if it's supposed to be between periods 4 and 5
        if (index === 3 && timetableSettings.lunchStartTime && timetableSettings.lunchEndTime) {
          timeline.push({ type: 'break', label: 'LUNCH', time: `${timetableSettings.lunchStartTime} - ${timetableSettings.lunchEndTime}` });
        }
  
        // Insert Short Break 2 if it's supposed to be between periods 6 and 7
        if (index === 5 && timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime) {
          timeline.push({ type: 'break', label: 'SHORT BREAK 2', time: `${timetableSettings.shortBreak2StartTime} - ${timetableSettings.shortBreak2EndTime}` });
        }
      }
    });
  
    // Insert reserved time if set and it falls after all periods
    if (timetableSettings.reserveTimeStart && timetableSettings.reserveTimeEnd) {
      timeline.push({ type: 'reserved', label: 'RESERVED TIME', time: `${timetableSettings.reserveTimeStart} - ${timetableSettings.reserveTimeEnd}` });
    }
  
    // Build rows for the PDF
    timeline.forEach(entry => {
      const row = [`${entry.time}`];
      if (entry.type === 'period') {
        days.forEach(day => {
          const periodAssignment = assignedPeriods[`${day}-${entry.period}`];
          const entryText = periodAssignment ? `${periodAssignment.teacher}\n${periodAssignment.subject}` : '+';
          row.push(entryText);
        });
      } else {
        row.push(entry.label); // For breaks and reserved time
      }
      rows.push(row);
    });
  
    const columns = ['Time', ...days];
  
    // Set up custom styles
    const headerStyles = {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    };
  
    const breakStyles = {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    };
  
    // Add school name
    doc.setFontSize(18);
    doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
    // Add the timetable heading
    doc.setFontSize(14);
    doc.text('School Timetable', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
    // Add class and section details
    const classSectionText = `Class: ${classId}    Section: ${sectionName}`;
    doc.setFontSize(12);
    const classSectionTextWidth = doc.getTextWidth(classSectionText);
    doc.text(classSectionText, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });
  
    // Create the table with merged cells for breaks, lunch, and reserved time
    doc.autoTable({
      startY: 45, // Adjust the Y position to leave space for headings
      head: [columns],
      body: rows,
      theme: 'grid',
      styles: {
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
      },
      headStyles: headerStyles,
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      rowPageBreak: 'avoid',
      didDrawCell: function (data) {
        if (data.column.index === 0 && ['SHORT BREAK 1', 'LUNCH', 'SHORT BREAK 2', 'RESERVED TIME'].includes(data.cell.raw)) {
          // Merge cells for break/lunch/reserved time labels
          const label = data.cell.raw;
          doc.setFillColor(245, 245, 245); // Grey background
          doc.rect(data.cell.x, data.cell.y, data.cell.width * columns.length, data.cell.height, 'F');
          doc.text(label, data.cell.x + data.cell.width * columns.length / 2, data.cell.y + data.cell.height / 2, {
            align: 'center',
            baseline: 'middle'
          });
        }
      },
      willDrawCell: function (data) {
        if (data.column.index > 0 && ['SHORT BREAK 1', 'LUNCH', 'SHORT BREAK 2', 'RESERVED TIME'].includes(data.cell.raw)) {
          data.cell.styles.fillColor = [245, 245, 245]; // Set background color for merged cells
        }
      },
    });
  
    const filename = `Timetable_${classId}_${sectionName}.pdf`;
    doc.save(filename);
  };
  
  
  
  
  return (
    <div className="container">
      <div className="header">
        <div className="school-info">
          <div className="class-info">
            <span className="label">Class :</span>
            <span className="line">{classId}</span>
          </div>
          <div className="section-info">
            <span className="label">Section :</span>
            <span className="line">{sectionName}</span>
          </div>
        </div>
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
