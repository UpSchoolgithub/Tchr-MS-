import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import Modal from 'react-modal';

const MTimetable = () => {
  const { schoolId } = useParams();
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [days, setDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTimetableSettings = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
        setTimetableSettings(response.data);
      } catch (error) {
        console.error('Error fetching timetable settings:', error);
      }
    };

    const fetchTeachersAndSubjects = async () => {
      try {
        const teachersResponse = await axiosInstance.get('/teachers');
        const subjectsResponse = await axiosInstance.get('/subjects');
        setTeachers(teachersResponse.data);
        setSubjects(subjectsResponse.data);
      } catch (error) {
        console.error('Error fetching teachers or subjects:', error);
      }
    };

    if (schoolId) {
      fetchTimetableSettings();
      fetchTeachersAndSubjects();
    }
  }, [schoolId]);

  const handleAddClick = (day, period) => {
    setSelectedDay(day);
    setSelectedPeriod(period);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      // Save the selected teacher and subject for the selected day and period
      const response = await axiosInstance.post(`/schools/${schoolId}/timetable/entry`, {
        day: selectedDay,
        period: selectedPeriod,
        teacherId: selectedTeacher,
        subjectId: selectedSubject,
      });
      console.log('Saved timetable entry:', response.data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving timetable entry:', error);
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
          {days.map(day => (
            <tr key={day}>
              <td>{day}</td>
              {periods.map(period => (
                <td key={period}>
                  <span
                    className="add-icon"
                    onClick={() => handleAddClick(day, period)}
                  >
                    +
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <h1>School Timetable</h1>
      {timetableSettings ? (
        renderTable()
      ) : (
        <p>Loading timetable settings...</p>
      )}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Tag Teacher and Subject"
      >
        <h2>Tag Teacher and Subject</h2>
        <div>
          <label>
            Teacher:
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Subject:
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      </Modal>
    </div>
  );
};

export default MTimetable;

