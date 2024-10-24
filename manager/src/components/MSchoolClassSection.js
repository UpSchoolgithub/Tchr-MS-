import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionId } = useParams();
  console.log('Class ID:', classId); // Check what is being passed
  console.log('Class ID:', classId);
  console.log('Section ID:', sectionId);
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
  //const [combinedSectionId, setCombinedSectionId] = useState('');
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
    fetchCalendarEventsAndHolidays(schoolId);
    fetchTeachers(schoolId);
    fetchSubjects(sectionId).then(fetchedSubjects => {
      setSubjects(fetchedSubjects); // Update state with fetched subjects
    });
    fetchTimetableSettings(schoolId);
}, [schoolId, sectionId]); // Use sectionId instead of sectionName

useEffect(() => {
    if (teachers.length > 0 && timetableSettings && Object.keys(assignedPeriods).length > 0) {
        fetchAssignments();
    }
}, [teachers, timetableSettings, sectionId]); // Use sectionId instead of combinedSectionId

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

  const fetchSubjects = async (sectionId) => {
    try {
      const response = await axiosInstance.get(`/sections/${sectionId}/subjects`);
      return response.data; // Ensure this returns the expected data
    } catch (error) {
      console.error(`Error fetching subjects for section ${sectionId}:`, error);
      return [];
    }
  };


  const fetchTimetableSettings = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      console.log('Timetable Settings Response:', response.data);
      setTimetableSettings(response.data);
    } catch (error) {
      setError('Error fetching timetable settings.');
      console.error('Error fetching timetable settings:', error);
    }
  };

  const generatePeriodTimings = () => {
    const { periodsPerDay, durationPerPeriod, schoolStartTime } = timetableSettings;
    const periodTimings = [];
    let startTime = new Date(`1970-01-01T${schoolStartTime}`);
  
    for (let i = 0; i < periodsPerDay; i++) {
      const endTime = new Date(startTime.getTime() + durationPerPeriod * 60000);
      periodTimings.push({
        start: formatTime(startTime),
        end: formatTime(endTime),
      });
      startTime = endTime; // Move to the next period's start time
    }
  
    setTimetableSettings((prevSettings) => ({
      ...prevSettings,
      periodTimings,
    }));
  };
  
  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5); // Extracts only the HH:MM part
  };

  const fetchAssignments = async () => {
    if (!subjects.length || !teachers.length) return; // Ensure teachers and subjects are loaded

    try {
        // Fetch assignments from the API
        const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionId}/assignments`);
        
        // Process the response data and map the assignments to their respective periods
        const assignments = response.data.reduce((acc, entry) => {
            const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown Teacher' };
            const subject = subjects.find(s => s.id === entry.subjectId) || { subjectName: 'Unknown Subject' };
            acc[`${entry.day}-${entry.period}`] = {
                teacher: teacher.name,
                teacherId: entry.teacherId,
                subject: subject.subjectName,
                subjectId: subject.id // Ensure subject ID is included
            };
            return acc;
        }, {});

        setAssignedPeriods(assignments);  // Set the assignments to assignedPeriods
    } catch (error) {
        console.error('Error fetching assignments:', error);
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
  const getSectionIdByName = async (schoolId, classId, sectionName) => {
    try {
      // Ensure the correct classId (116 in your case) is passed here
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections`);
      const sections = response.data;
      
      // Match the sectionName to get the sectionId
      const section = sections.find(sec => sec.sectionName === sectionName);
      if (section) {
        return section.id;
      } else {
        throw new Error('Section not found');
      }
    } catch (error) {
      console.error('Error fetching sectionId:', error);
      throw error;
    }
  };
  
  

  const fetchSectionIdByName = async () => {
    try {
      // Update the classId to the correct value (116 in this case)
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/116/sections`);
      const sections = response.data;
      // Proceed with logic to handle the sections
    } catch (error) {
      console.error('Error fetching sectionId:', error);
    }
  };
  
  
  const handleAssignPeriod = async (e) => {
    e.preventDefault(); // Prevent the default form submission

    try {
        // Get start and end times for the selected period
        const startTime = timetableSettings.periodTimings[selectedPeriod.period - 1]?.start;
        const endTime = timetableSettings.periodTimings[selectedPeriod.period - 1]?.end;

        // Prepare the request data for the API
        const requestData = {
            schoolId,
            classId,
            sectionId,  // Pass the sectionId here
            teacherId: selectedTeacher,
            subjectId: selectedSubject,
            day: selectedPeriod.day,
            period: selectedPeriod.period,
            startTime,
            endTime
        };

        // Send the assignment request to the server
        const response = await axiosInstance.post('/timetable/assign', requestData);
        
        // Set success message and refetch assignments to update the table
        setSuccessMessage('Assignment added successfully!');
        await fetchAssignments(); // Refetch assignments to ensure the state is updated
        
        handleCloseModal(); // Close the modal after assigning
    } catch (error) {
        console.error('Error assigning period:', error.response || error);
        setError('Failed to assign period. Please try again.');
    }
};

  

  
  
  

  const handleReload = () => {
    fetchAssignments();
    setShowReloadButton(false);
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
    if (!timetableSettings || !timetableSettings.periodTimings || timetableSettings.periodTimings.length === 0) {
        return <p>No timetable settings available</p>;
    }

    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
                {periods.map((period, index) => {
                    const startEndTime = timetableSettings.periodTimings[index];
                    const periodTime = `${startEndTime.start} - ${startEndTime.end}`;
                    const periodName = `Period ${period}`;

                    return (
                        <tr key={index}>
                            <td>
                                {periodName} <br />
                                {periodTime}
                            </td>
                            {days.map((day, dayIndex) => {
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
                    );
                })}
            </tbody>
        </table>
    );
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

  




const downloadTimetableAsPDF = () => {
  if (!timetableSettings || !timetableSettings.periodTimings || timetableSettings.periodTimings.length === 0) {
    alert('No timetable settings available to download.');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const rows = [];
  const timeline = [];

  periods.forEach((period, index) => {
    const startEndTime = timetableSettings.periodTimings[index];
    if (startEndTime) {
      timeline.push({ type: 'period', period, time: startEndTime });

      if (index === 1 && timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime) {
        timeline.push({ type: 'break', label: 'SHORT BREAK 1', time: `${timetableSettings.shortBreak1StartTime} - ${timetableSettings.shortBreak1EndTime}` });
      }
  
      if (index === 3 && timetableSettings.lunchStartTime && timetableSettings.lunchEndTime) {
        timeline.push({ type: 'break', label: 'LUNCH', time: `${timetableSettings.lunchStartTime} - ${timetableSettings.lunchEndTime}` });
      }
  
      if (index === 5 && timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime) {
        timeline.push({ type: 'break', label: 'SHORT BREAK 2', time: `${timetableSettings.shortBreak2StartTime} - ${timetableSettings.shortBreak2EndTime}` });
      }
    }
  });

  if (timetableSettings.reserveTimeStart && timetableSettings.reserveTimeEnd) {
    timeline.push({ type: 'reserved', label: 'RESERVED TIME', time: `${timetableSettings.reserveTimeStart} - ${timetableSettings.reserveTimeEnd}` });
  }

  timeline.forEach(entry => {
    const row = [`${entry.time}`];
    if (entry.type === 'period') {
      days.forEach(day => {
        const periodAssignment = assignedPeriods[`${day}-${entry.period}`];
        const entryText = periodAssignment ? `${periodAssignment.teacher}\n${periodAssignment.subject}` : '';
        row.push(entryText);
      });
    } else {
      row.push(entry.label);
    }
    rows.push(row);
  });

  const columns = ['Time', ...days];

  doc.setFontSize(18);
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text('School Timetable', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  const classSectionText = `Class: ${classId}    Section ID: ${sectionId}`; // Use sectionId
  doc.setFontSize(12);
  doc.text(classSectionText, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });

  doc.autoTable({
    startY: 45,
    head: [columns],
    body: rows,
    theme: 'grid',
    styles: {
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  const filename = `Timetable_${classId}_${sectionId}.pdf`; // Change from sectionName to sectionId
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
          <span className="label">Section ID :</span>
          <span className="line">{sectionId}</span> {/* Change here */}
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
          <p>Section ID: {sectionId}</p> {/* Change here */}
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
