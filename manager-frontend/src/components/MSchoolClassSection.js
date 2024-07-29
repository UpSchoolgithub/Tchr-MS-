import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
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
  const [error, setError] = useState(null);
  const [combinedSectionId, setCombinedSectionId] = useState('');
  const [students, setStudents] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [fileUploaded, setFileUploaded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [isEditWarningOpen, setIsEditWarningOpen] = useState(false);

  useEffect(() => {
    const storedSubjects = JSON.parse(localStorage.getItem('selectedSubjects'));
    if (storedSubjects) {
      setSubjects(storedSubjects);
    }
    setCombinedSectionId(`${schoolId}-${classId}-${sectionName}`);
    fetchCalendarEventsAndHolidays(schoolId);
    fetchTeachers(schoolId);
    fetchTimetableSettings(schoolId);
  }, [schoolId, sectionName]);

  useEffect(() => {
    if (teachers.length > 0 && timetableSettings) {
      fetchAssignments();
    }
  }, [teachers, timetableSettings, combinedSectionId]);

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
      console.log(`Fetching assignments for Combined Section ID: ${combinedSectionId}`);
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

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleShowCalendar = () => {
    setShowCalendar(true);
    setShowTimetable(false);
    setShowStudents(false);
  };

  const handleShowTimetable = () => {
    setShowTimetable(true);
    setShowCalendar(false);
    setShowStudents(false);
  };

  const handleShowStudents = () => {
    setShowStudents(true);
    setShowCalendar(false);
    setShowTimetable(false);
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
      console.log('Request Data:', requestData);
  
      await axiosInstance.post(`/timetable/assign`, requestData);
  
      const teacher = teachers.find(t => t.id === selectedTeacher) || { name: 'Unknown Teacher' };
      const subject = subjects.find(s => s.id === selectedSubject) || { subjectName: 'Unknown Subject' };
  
      const newAssignedPeriod = {
        teacher: teacher.name,
        teacherId: selectedTeacher,
        subject: subject.subjectName,
        subjectId: selectedSubject
      };
  
      setAssignedPeriods({
        ...assignedPeriods,
        [`${selectedPeriod.day}-${selectedPeriod.period}`]: newAssignedPeriod
      });
  
      setIsModalOpen(false);
      fetchAssignments(); // Refresh assignments after assigning a period
    } catch (error) {
      console.error('Error assigning period:', error.response || error);
      setError('Error assigning period');
    }
  };
  

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const studentsData = data.slice(1).map((row) => ({
        rollNumber: row[0],
        studentName: row[1],
        studentEmail: row[2],
        studentPhoneNumber: row[3],
        parentName: row[4],
        parentPhoneNumber1: row[5],
        parentPhoneNumber2: row[6],
        parentEmail: row[7],
      }));
      setStudents(studentsData);
      setFileUploaded(true);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileSubmit = async () => {
    const payload = { 
      students: students, 
      combinedSectionId, 
      schoolId,
      classId,
      sectionName 
    };
    console.log('Submitting payload:', payload);
    
    try {
      const response = await axiosInstance.post(`/students/upload`, payload); // Corrected URL
      console.log('Students data stored in the database:', response.data);
    } catch (error) {
      console.error('Error storing students data in the database:', error);
    }
  };

  const generateDateColumns = () => {
    const startOfMonth = dayjs().year(selectedYear).month(selectedMonth).startOf('month');
    const endOfMonth = dayjs().year(selectedYear).month(selectedMonth).endOf('month');
    const dates = [];
    for (let date = startOfMonth; date.isBefore(endOfMonth) || date.isSame(endOfMonth); date = date.add(1, 'day')) {
      dates.push(date.format('D'));
    }
    return dates;
  };

  const renderStudentsTable = () => {
    let columns = ['Roll Number', 'Student Name'];

    if (showPersonalDetails) {
      columns = [...columns, 'Student Email', 'Student Phone Number', 'Parent Name', 'Parent Phone Number 1', 'Parent Phone Number 2', 'Parent Email'];
    } else if (showAttendance || showAssignments || showTests) {
      columns = [...columns, ...generateDateColumns()];
    }

    return (
      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index}>
                <td>{student.rollNumber}</td>
                <td>{student.studentName}</td>
                {showPersonalDetails && <td>{student.studentEmail}</td>}
                {showPersonalDetails && <td>{student.studentPhoneNumber}</td>}
                {showPersonalDetails && <td>{student.parentName}</td>}
                {showPersonalDetails && <td>{student.parentPhoneNumber1}</td>}
                {showPersonalDetails && <td>{student.parentPhoneNumber2}</td>}
                {showPersonalDetails && <td>{student.parentEmail}</td>}
                {(showAttendance || showAssignments || showTests) && generateDateColumns().map((date, idx) => <td key={idx}>-</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTable = () => {
    if (!timetableSettings) return null;

    const periods = Array.from({ length: timetableSettings.periodsPerDay }, (_, i) => i + 1);

    return (
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
              {periods.map(period => (
                <td key={period} onClick={() => handleOpenModal(day, period)}>
                  {assignedPeriods[`${day}-${period}`] ? (
                    <>
                      <div>{assignedPeriods[`${day}-${period}`].teacher}</div>
                      <div>{assignedPeriods[`${day}-${period}`].subject}</div>
                    </>
                  ) : (
                    <span className="add-icon">+</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const combinedList = [...calendarEvents, ...holidays].sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));

  const filteredList = combinedList.filter((item) => {
    if (filter === 'events') return item.eventName;
    if (filter === 'holidays') return item.name;
    return true;
  });

  return (
    <div className="container">
      <div className="header">
        <h1>Class and Section Details</h1>
        <button className="details-button" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      {showDetails && (
        <div className="details">
          <p>School ID: {schoolId}</p>
          <p>Class ID: {classId}</p>
          <p>Section Name: {sectionName}</p>
        </div>
      )}
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
      <div className="buttons">
        <button onClick={handleShowCalendar}>School Calendar</button>
        <button onClick={handleShowTimetable}>Timetable</button>
        <button onClick={handleShowStudents}>Students</button>
      </div>
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
              <ul>
                {filteredList.map((item) => (
                  <li key={item.id}>
                    {item.eventName || item.name} - {item.date || `${item.startDate} to ${item.endDate}`}
                  </li>
                ))}
              </ul>
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
      {showStudents && (
        <div className="students">
          <h2>
            Students - {showPersonalDetails && 'Personal Details'}
            {showAttendance && 'Attendance'}
            {showAssignments && 'Assignments'}
            {showTests && 'Tests'}
          </h2>
          <div className="view-buttons">
            <button onClick={() => { setShowPersonalDetails(true); setShowAttendance(false); setShowAssignments(false); setShowTests(false); }}>Personal Details</button>
            <button onClick={() => { setShowPersonalDetails(false); setShowAttendance(true); setShowAssignments(false); setShowTests(false); }}>Attendance</button>
            <button onClick={() => { setShowPersonalDetails(false); setShowAttendance(false); setShowAssignments(true); setShowTests(false); }}>Assignments</button>
            <button onClick={() => { setShowPersonalDetails(false); setShowAttendance(false); setShowAssignments(false); setShowTests(true); }}>Tests</button>
          </div>
          {(showAttendance || showAssignments || showTests) && (
            <div className="month-year">
              <label>
                Month:
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {dayjs().month(i).format('MMMM')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Year:
                <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
              </label>
            </div>
          )}
          <div className="file-upload">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </div>
          {fileUploaded && (
            <button onClick={handleFileSubmit}>Submit</button>
          )}
          {renderStudentsTable()}
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
