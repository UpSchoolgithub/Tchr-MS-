import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionId } = useParams();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'holidays'
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
  const navigate = useNavigate();

  useEffect(() => {
    const storedSubjects = JSON.parse(localStorage.getItem('selectedSubjects'));
    if (storedSubjects) {
      setSubjects(storedSubjects);
    }
    fetchCalendarEventsAndHolidays(schoolId);
    fetchTeachers(schoolId);
    fetchTimetableSettings(schoolId);
  }, [schoolId]);

  useEffect(() => {
    if (teachers.length > 0 && timetableSettings) {
      fetchAssignments();
    }
  }, [teachers, timetableSettings]);

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
      const response = await axiosInstance.get(`/schools/timetable/${schoolId}/assignments`);
      const assignments = response.data.reduce((acc, entry) => {
        if (entry.sectionId === Number(sectionId)) {
          const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown Teacher' };
          const subject = subjects.find(s => s.id === entry.subjectId) || { subjectName: 'Unknown Subject' };
          acc[`${entry.day}-${entry.period}`] = {
            teacher: teacher.name,
            teacherId: entry.teacherId,
            subject: subject.subjectName,
            subjectId: entry.subjectId
          };
        }
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
  };

  const handleShowTimetable = () => {
    setShowTimetable(true);
    setShowCalendar(false);
  };

  const handleOpenModal = (day, period) => {
    setSelectedPeriod({ day, period });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAssignPeriod = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        schoolId,
        classId,
        sectionId: Number(sectionId), // Ensure sectionId is a number
        teacherId: selectedTeacher,
        subjectId: selectedSubject,
        period: selectedPeriod.period,
        day: selectedPeriod.day,
      };
      console.log('Request Data:', requestData); // Log request data

      await axiosInstance.post(`/schools/${schoolId}/timetable/assign`, requestData);

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
    } catch (error) {
      console.error('Error assigning period:', error.response || error);
    }
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
    <div>
      <h1>Class and Section Details</h1>
      <div>
        <p>School ID: {schoolId}</p>
        <p>Class ID: {classId}</p>
        <p>Section ID: {sectionId}</p>
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
        <button onClick={handleShowCalendar}>School Calendar</button>
        <button onClick={handleShowTimetable}>Timetable</button>
        <button onClick={() => navigate('/students')}>Students</button>
      </div>
      {showCalendar && (
        <div>
          <h2>School Calendar Events</h2>
          <label>
            Filter:
            <select onChange={handleFilterChange} value={filter}>
              <option value="all">All</option>
              <option value="events">Events</option>
              <option value="holidays">Holidays</option>
            </select>
          </label>
          <div>
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
        <div>
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
    </div>
  );
};

export default MSchoolClassSection;
