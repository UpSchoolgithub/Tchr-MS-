import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';
import Student from './Student'; // Replace with Student.js
import Attendance from './Attendance';
import Assignments from './Assignments'; // Import Assignments component
import Tests from './Tests'; // Import Tests component
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
  const [students, setStudents] = useState([]);

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
  const [showStudents, setShowStudents] = useState(false); // State to control "Students" section visibility
  const [selectedTab, setSelectedTab] = useState('Student Personal'); // State to track selected tab

  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);

  const [teacherFilter, setTeacherFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  
  // In timetable of fetching class and section names based on IDs
  useEffect(() => {
    const fetchClassAndSectionDetails = async () => {
      try {
        const classResponse = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}`);
        setClassName(classResponse.data.className);  // Ensure this is the correct field
        
        const sectionResponse = await axiosInstance.get(`/sections/${sectionId}`);
        setSectionName(sectionResponse.data.sectionName);  // Ensure this is the correct field
      } catch (error) {
        console.error('Error fetching class and section details:', error);
      }
    };
  
    fetchClassAndSectionDetails();
  }, [schoolId, classId, sectionId]);
  
  
  
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

//fetch students
useEffect(() => {
  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/students`);
      const parsedStudents = response.data.map(student => ({
        rollNumber: student.rollNumber,
        name: student.studentName,
      }));
      setStudents(parsedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  fetchStudents();
}, [schoolId, classId, sectionId]);

useEffect(() => {
  if (teachers.length > 0 && timetableSettings && subjects.length > 0) {
    fetchAssignments();
  }
}, [teachers, timetableSettings, subjects, sectionId]);// Use sectionId instead of combinedSectionId

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
      
      // Check if `includeSaturday` is present and correct in response
      if ('includeSaturday' in response.data) {
        console.log('includeSaturday:', response.data.includeSaturday); // Should log true or false
      } else {
        console.warn('includeSaturday not found in timetable settings response');
      }
      
      setTimetableSettings(response.data);
  
      // Check if state has updated
      console.log('Updated Timetable Settings:', timetableSettings);
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
      setLoading(true); // Set loading state before the request
      const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionId}/assignments`);
      
      const assignments = response.data.reduce((acc, entry) => {
        const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown Teacher' };
        const subject = subjects.find(s => s.id === entry.subjectId) || { subjectName: 'Unknown Subject' };
        acc[`${entry.day}-${entry.period}`] = {
          teacher: teacher.name,
          teacherId: entry.teacherId,
          subject: subject.subjectName,
          subjectId: subject.id
        };
        return acc;
      }, {});
  
      setAssignedPeriods(assignments);
      setLoading(false); // Set loading to false after data is fetched
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments.');
      setLoading(false);
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

  // Show "Students" section
  const handleShowStudents = () => {
    setShowStudents(true); // Show "Students" section
    setShowCalendar(false);
    setShowTimetable(false); // Hide other sections
  };

  // Update selected tab within "Students" section
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };

  // Render content based on selected tab in "Students" section
  const renderStudentContent = () => {
    switch (selectedTab) {
      case 'Student Personal':
        return <div>Display personal details of students here.</div>;
      case 'Attendance':
        return <div>Display attendance records of students here.</div>;
      case 'Assignments':
        return <div>Display assignment details of students here.</div>;
      case 'Test':
        return <div>Display test records of students here.</div>;
      default:
        return <div>Select a tab to view details.</div>;
    }
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
  
    // Define days to include all days from Monday to Sunday
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const lastPeriodEnd = timetableSettings.periodTimings[timetableSettings.periodsPerDay - 1].end;
  
    // Handle reserve type "time" with common start/end times, or "day" with per-day times
    const reserveType = timetableSettings.reserveType;
    const commonReserveStart = timetableSettings.reserveTimeStart;
    const commonReserveEnd = timetableSettings.reserveTimeEnd;
    let reserveDay = {};
  
    // Parse reserveDay only if reserveType is "day"
    if (reserveType === "day") {
      try {
        reserveDay = JSON.parse(timetableSettings.reserveDay || '{}');
      } catch (e) {
        console.error('Error parsing reserveDay:', e);
        reserveDay = {};
      }
  
      // Ensure defaults for each day in reserveDay
      days.forEach(day => {
        reserveDay[day] = reserveDay[day] || { open: false, start: '00:00', end: '00:00' };
      });
    }
  
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
              <React.Fragment key={index}>
                <tr>
                  <td>
                    {periodName} <br />
                    {periodTime}
                  </td>
                  {days.map(day => {
                    const periodAssignment = assignedPeriods ? assignedPeriods[`${day}-${period}`] : undefined;
                    let isReservedWithinPeriod = false;
                    let reserveStart = '';
                    let reserveEnd = '';
  
                    // Apply reserve time only to all days except Sunday
                    if (day !== 'Sunday') {
                      if (reserveType === "time") {
                        isReservedWithinPeriod =
                          startEndTime.start <= commonReserveEnd &&
                          startEndTime.end >= commonReserveStart;
                        reserveStart = commonReserveStart;
                        reserveEnd = commonReserveEnd;
                      } else if (reserveType === "day" && reserveDay[day]?.open) {
                        const reservedTime = reserveDay[day];
                        isReservedWithinPeriod =
                          startEndTime.start <= reservedTime.end &&
                          startEndTime.end >= reservedTime.start;
                        reserveStart = reservedTime.start;
                        reserveEnd = reservedTime.end;
                      }
                    }
  
                    return (
                      <td key={`${day}-${period}`} onClick={() => !isReservedWithinPeriod && handleOpenModal(day, period)}>
                        {isReservedWithinPeriod ? (
                          <span className="reserved">
                            Reserved Time ({reserveStart} - {reserveEnd})
                          </span>
                        ) : periodAssignment ? (
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
  
                {/* Insert Breaks */}
                {index === 1 && timetableSettings.shortBreak1StartTime && timetableSettings.shortBreak1EndTime && (
                  <tr key="short-break-1">
                    <td>{`${timetableSettings.shortBreak1StartTime} - ${timetableSettings.shortBreak1EndTime}`}</td>
                    <td colSpan={days.length}>SHORT BREAK 1</td>
                  </tr>
                )}
                {index === 3 && timetableSettings.lunchStartTime && timetableSettings.lunchEndTime && (
                  <tr key="lunch">
                    <td>{`${timetableSettings.lunchStartTime} - ${timetableSettings.lunchEndTime}`}</td>
                    <td colSpan={days.length}>LUNCH</td>
                  </tr>
                )}
                {index === 5 && timetableSettings.shortBreak2StartTime && timetableSettings.shortBreak2EndTime && (
                  <tr key="short-break-2">
                    <td>{`${timetableSettings.shortBreak2StartTime} - ${timetableSettings.shortBreak2EndTime}`}</td>
                    <td colSpan={days.length}>SHORT BREAK 2</td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
  
          {/* After School Hours Reserved Time Row */}
          <tr>
            <td>After School Hours Reserved Time</td>
            {days.map(day => {
              const isAfterSchoolHours =
                day !== 'Sunday' &&
                reserveType === "time" &&
                commonReserveStart >= lastPeriodEnd;
  
              const reserveAfterSchool =
                reserveType === "day" &&
                reserveDay[day]?.open &&
                reserveDay[day].start >= lastPeriodEnd;
  
              return (
                <td key={day}>
                  {isAfterSchoolHours ? (
                    <div className="reserved">
                      afterschool hours <br />
                      {`${commonReserveStart} to ${commonReserveEnd}`}
                    </div>
                  ) : reserveAfterSchool ? (
                    <div className="reserved">
                      afterschool hours <br />
                      {`${reserveDay[day].start} to ${reserveDay[day].end}`}
                    </div>
                  ) : (
                    <span>-</span> // Placeholder if no reserved time after school hours
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    );
  };
  
  
  
  
  
  
 // tthi is updated 
  
  
  
  
            
  


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
    if (!timetableSettings || !timetableSettings.periodTimings) {
      alert('No timetable settings available to download.');
      return;
    }
  
    // 1. Change orientation to 'landscape'
    const doc = new jsPDF('landscape');  // This makes the PDF landscape
  
    const periods = Array.from({ length: timetableSettings.periodsPerDay || 0 }, (_, i) => i + 1);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const rows = [];
  
    // 2. Generate rows for each period with assigned teacher and subject
    periods.forEach((period, index) => {
      const periodTiming = timetableSettings.periodTimings[index];
      const periodTimeText = periodTiming ? `${periodTiming.start} - ${periodTiming.end}` : 'No Time';
  
      const row = [periodTimeText];
      days.forEach((day) => {
        const periodAssignment = assignedPeriods[`${day}-${period}`];
        const entryText = periodAssignment ? `${periodAssignment.teacher}\n${periodAssignment.subject}` : '';
        row.push(entryText);
      });
      rows.push(row);
    });
  
    const columns = ['Time', ...days];
  
    // 3. Add the centered title with school name, class, and section details
    doc.setFontSize(16);
    doc.text(schoolName, doc.internal.pageSize.width / 2, 14, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Class: ${className}    Section: ${sectionName}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });
  
    // 4. Add the timetable table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,  // Starting position of the table after the title
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
  
    // 5. Save the PDF with a filename
    const filename = `Timetable_${className}_${sectionName}.pdf`;
    doc.save(filename);
  };
  
  
  
  
  
  
  
return (
  <div className="container">
    <div className="header">
      <div className="school-info">
      <div className="class-info">
        <span className="label">Class :</span>
        <span className="line">{className || classId}</span> {/* Show className if available, else fallback to classId */}
      </div>
      <div className="section-info">
        <span className="label">Section :</span>
        <span className="line">{sectionName || sectionId}</span> {/* Show sectionName if available, else fallback to sectionId */}
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
      <p>Class: {className || classId}</p> {/* Use className instead of classId */}
      <p>Section: {sectionName || sectionId}</p> {/* Use sectionName instead of sectionId */}
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
      <button onClick={handleShowStudents}>Students</button> {/* "Students" button */}
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

{/* Show Students Section */}
{showStudents && (
        <div className="students-section">
          <h2>Students Information</h2>
          <div className="student-tabs">
            <button className={selectedTab === 'Student Personal' ? 'active-tab' : ''} onClick={() => handleTabChange('Student Personal')}>Student Personal</button>
            <button className={selectedTab === 'Attendance' ? 'active-tab' : ''} onClick={() => handleTabChange('Attendance')}>Attendance</button>
            <button className={selectedTab === 'Assignments' ? 'active-tab' : ''} onClick={() => handleTabChange('Assignments')}>Assignments</button>
            <button className={selectedTab === 'Test' ? 'active-tab' : ''} onClick={() => handleTabChange('Test')}>Test</button>
          </div>
          <div className="tab-content">
            {selectedTab === 'Student Personal' && (
              <Student schoolId={schoolId} classId={classId} sectionId={sectionId} />
            )}
            {selectedTab === 'Attendance' && (
              <Attendance schoolId={schoolId} classId={classId} sectionId={sectionId} />
            )}
            {selectedTab === 'Assignments' && (
              <Assignments schoolId={schoolId} classId={classId} sectionId={sectionId} />
            )}
            {selectedTab === 'Test' && (
              <Tests schoolId={schoolId} classId={classId} sectionId={sectionId} />
            )}
            </div>
        </div>
      )}
    </div>
  );
};


export default MSchoolClassSection;



