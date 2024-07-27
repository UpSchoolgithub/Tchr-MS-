import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import { useManagerAuth } from '../context/ManagerAuthContext';

Modal.setAppElement('#root');

const MTimetable = ({ schoolId, classId, sectionId, subjects }) => {
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [days] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  const [teachers, setTeachers] = useState([]);
  const { token } = useManagerAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignedPeriods, setAssignedPeriods] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetableSettings = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
        setTimetableSettings(response.data);
      } catch (error) {
        setError('Error fetching timetable settings.');
        console.error('Error fetching timetable settings:', error);
      }
    };

    const fetchTeachers = async () => {
      try {
        const response = await axiosInstance.get(`/schools/${schoolId}/teachers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setTeachers(response.data);
      } catch (error) {
        setError('Error fetching teachers.');
        console.error('Error fetching teachers:', error);
      }
    };

    const fetchAssignments = async () => {
      try {
        const response = await axiosInstance.get(`/schools/timetable/${schoolId}/assignments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const assignments = response.data.reduce((acc, entry) => {
          acc[`${entry.day}-${entry.period}`] = {
            teacher: entry.teacherId,
            subject: entry.subjectId,
            teacherId: entry.teacherId,
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

    if (schoolId) {
      fetchTimetableSettings();
      fetchTeachers();
      fetchAssignments();
    }
  }, [schoolId, classId, token]);

  const openModal = (day, period) => {
    if (assignedPeriods[`${day}-${period}`]) {
      const confirmEdit = window.confirm('This period is already assigned. Are you sure you want to change it?');
      if (!confirmEdit) return;
      setSelectedTeacher(assignedPeriods[`${day}-${period}`].teacherId);
      setSelectedSubject(assignedPeriods[`${day}-${period}`].subjectId);
    } else {
      setSelectedTeacher('');
      setSelectedSubject('');
    }
    setSelectedPeriod({ day, period });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher('');
    setSelectedSubject('');
  };

  const handleAssign = async () => {
    try {
      // Ensure sectionId is a valid integer
      console.log('sectionId received:', sectionId);
      const parsedSectionId = parseInt(sectionId, 10);
      console.log('Parsed sectionId:', parsedSectionId);
      if (isNaN(parsedSectionId)) {
        throw new Error('Invalid sectionId');
      }

      const requestData = {
        schoolId,
        classId,
        sectionId: parsedSectionId,
        subjectId: selectedSubject,
        teacherId: selectedTeacher,
        day: selectedPeriod.day,
        period: selectedPeriod.period
      };
      console.log('Assigning period with requestData:', requestData);

      await axiosInstance.post('/schools/timetable/assign', requestData);

      const selectedTeacherObject = teachers.find(teacher => teacher.id === selectedTeacher);
      const selectedSubjectObject = subjects.find(subject => subject.id === selectedSubject);

      const teacherName = selectedTeacherObject ? selectedTeacherObject.name : 'Unknown Teacher';
      const subjectName = selectedSubjectObject ? selectedSubjectObject.subjectName || selectedSubjectObject.name : 'Unknown Subject';

      const newAssignedPeriod = {
        teacher: teacherName,
        teacherId: selectedTeacher,
        subject: subjectName,
        subjectId: selectedSubject
      };

      const newAssignedPeriods = {
        ...assignedPeriods,
        [`${selectedPeriod.day}-${selectedPeriod.period}`]: newAssignedPeriod
      };
      setAssignedPeriods(newAssignedPeriods);

      console.log(`Assigned ${teacherName} to teach ${subjectName} on ${selectedPeriod.day} during period ${selectedPeriod.period}`);
      closeModal();
    } catch (error) {
      if (error.message === 'Invalid sectionId') {
        setError('Invalid section ID. Please select a valid section.');
      } else if (error.response && error.response.status === 404) {
        setError('The requested resource was not found.');
      } else if (error.response && error.response.status === 400) {
        setError(`Bad request. Please check the data you are sending: ${error.response.data}`);
      } else {
        setError('Error assigning period.');
      }
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
          {days.map(day => (
            <tr key={day}>
              <td>{day}</td>
              {periods.map(period => (
                <td key={period} onClick={() => openModal(day, period)}>
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

  return (
    <div>
      {error && <p className="error-message">{error}</p>}
      {timetableSettings ? (
        renderTable()
      ) : (
        <p>Loading timetable settings...</p>
      )}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Assign Subject and Teacher"
      >
        <h2>Assign Subject and Teacher</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleAssign(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Subject:</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required style={{ width: '200px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="" disabled>Select Subject</option>
              {subjects.length > 0 ? subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.subjectName || subject.name}</option>
              )) : <option disabled>No subjects available</option>}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Teacher:</label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required style={{ width: '200px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="" disabled>Select Teacher</option>
              {teachers.length > 0 ? teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              )) : <option disabled>No teachers available</option>}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Assign</button>
            <button type="button" onClick={closeModal} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MTimetable;
