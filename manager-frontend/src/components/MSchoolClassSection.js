import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import './MSchoolClassSection.css';

// Set the app element for the modal
Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionId } = useParams();
  const [schools, setSchools] = useState([]);
  const [combinedClassSections, setCombinedClassSections] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'holidays'
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacher, setTeacher] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [timetableEntries, setTimetableEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (schoolId) {
      fetchCombinedClassSectionsSubjects(schoolId);
      fetchCalendarEventsAndHolidays(schoolId);
      fetchTimetableSettings(schoolId);
      fetchTeachers(schoolId);
    }
  }, [schoolId]);

  useEffect(() => {
    if (classId && sectionId) {
      fetchTimetableEntries(schoolId, classId, sectionId); // Fetch timetable entries
    }
  }, [classId, sectionId]);

  const fetchSchools = async () => {
    try {
      const response = await axiosInstance.get('/managers/4/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchCombinedClassSectionsSubjects = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes-sections-subjects`);
      const combinedClassSectionsMap = new Map();

      response.data.forEach(item => {
        const key = `${item.classId}-${item.sectionId}`;
        if (!combinedClassSectionsMap.has(key)) {
          combinedClassSectionsMap.set(key, {
            classId: item.classId,
            sectionId: item.sectionId,
            className: item.className,
            sectionName: item.sectionName,
            subjects: new Set([item.subjectName])
          });
        } else {
          combinedClassSectionsMap.get(key).subjects.add(item.subjectName);
        }
      });

      const combinedClassSections = Array.from(combinedClassSectionsMap.values()).map(item => ({
        ...item,
        subjects: Array.from(item.subjects)
      }));

      setCombinedClassSections(combinedClassSections);
    } catch (error) {
      console.error('Error fetching combined classes, sections, and subjects:', error);
    }
  };

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

  const fetchTimetableSettings = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      setTimetableSettings(response.data);
    } catch (error) {
      console.error('Error fetching timetable settings:', error);
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

  const fetchTimetableEntries = async (schoolId, classId, sectionId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/timetable`);
      setTimetableEntries(response.data);
    } catch (error) {
      console.error('Error fetching timetable entries:', error);
    }
  };

  const handleSchoolChange = (e) => {
    const newSchoolId = e.target.value;
    navigate(`/dashboard/school/${newSchoolId}/class/${classId}/section/${sectionId}`);
    setCombinedClassSections([]);  // Clear previous class-section data
  };

  const handleClassSectionChange = (e) => {
    const [newClassId, newSectionId] = e.target.value.split('-');
    navigate(`/dashboard/school/${schoolId}/class/${newClassId}/section/${newSectionId}`);
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

  const handleAddClick = (day, period) => {
    setSelectedDay(day);
    setSelectedPeriod(period);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      const existingEntry = timetableEntries.find(
        entry => entry.day === selectedDay && entry.period === selectedPeriod
      );

      if (existingEntry) {
        const confirmUpdate = window.confirm(
          `An entry already exists for ${selectedDay}, Period ${selectedPeriod}. Do you want to update it?`
        );

        if (confirmUpdate) {
          await axiosInstance.put(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/timetable/${existingEntry.id}`, {
            day: selectedDay,
            period: selectedPeriod,
            teacherId: teacher,
            subjectId: subject,
          });
          fetchTimetableEntries(schoolId, classId, sectionId);
          setIsModalOpen(false);
        }
      } else {
        await axiosInstance.post(`/schools/${schoolId}/classes/${classId}/sections/${sectionId}/timetable`, {
          day: selectedDay,
          period: selectedPeriod,
          teacherId: teacher,
          subjectId: subject,
        });
        fetchTimetableEntries(schoolId, classId, sectionId);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving timetable entry:', error);
    }
  };

  const getClassSectionSubjects = () => {
    const selectedClassSection = combinedClassSections.find(
      (item) => item.classId === parseInt(classId) && item.sectionId === parseInt(sectionId)
    );
    return selectedClassSection ? selectedClassSection.subjects : [];
  };

  const combinedList = [...calendarEvents, ...holidays].sort((a, b) => new Date(a.date || a.startDate) - new Date(b.date || b.startDate));

  const filteredList = combinedList.filter((item) => {
    if (filter === 'events') return item.eventName;
    if (filter === 'holidays') return item.name;
    return true;
  });

  const periods = timetableSettings ? Array.from({ length: timetableSettings.periodsPerDay }, (_, i) => i + 1) : [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="container">
      <h1>Class and Section Details</h1>
      <div className="details">
        <p>School ID: {schoolId}</p>
        <p>Class ID: {classId}</p>
        <p>Section ID: {sectionId}</p>
        <div className="dropdown">
          <label>
            Change School:
            <select onChange={handleSchoolChange} value={schoolId}>
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dropdown">
          <label>
            Change Class & Section:
            <select onChange={handleClassSectionChange} value={`${classId}-${sectionId}`}>
              <option value="">Select Class & Section</option>
              {combinedClassSections.map((item) => (
                <option key={`${item.classId}-${item.sectionId}`} value={`${item.classId}-${item.sectionId}`}>
                  {item.className} - {item.sectionName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="dropdown">
          <label>
            Subjects:
            <ul>
              {getClassSectionSubjects().length > 0 ? getClassSectionSubjects().map((subject, index) => (
                <li key={`${subject}-${index}`}>{subject}</li>
              )) : <li>No subjects available</li>}
            </ul>
          </label>
        </div>
      </div>
      <div className="buttons">
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
      {showTimetable && timetableSettings && (
        <div>
          <h2>Timetable</h2>
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
              {days.map(day => (
                <tr key={day}>
                  <td>{day}</td>
                  {periods.map(period => (
                    <td key={period}>
                      {timetableEntries
                        .filter(entry => entry.day === day && entry.period === period)
                        .map(entry => (
                          <div key={entry.id}>
                            <p onClick={() => handleAddClick(day, period)}>{entry.Teacher.name}</p>
                            <p onClick={() => handleAddClick(day, period)}>{entry.Subject.subjectName}</p>
                          </div>
                        ))}
                      {!timetableEntries.some(entry => entry.day === day && entry.period === period) && (
                        <span
                          className="add-icon"
                          onClick={() => handleAddClick(day, period)}
                        >
                          +
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleModalClose}
        contentLabel="Assign Teacher and Subject"
        className="modal-content"
      >
        <h2>Assign Teacher and Subject</h2>
        <form>
          <div>
            <label>Teacher:</label>
            <select value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Subject:</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {getClassSectionSubjects().map((subject, index) => (
                <option key={`${subject}-${index}`} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={handleSave}>Save</button>
          <button type="button" onClick={handleModalClose}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
};

export default MSchoolClassSection;
