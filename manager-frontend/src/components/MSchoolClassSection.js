import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';
import PeriodAssignmentForm from './PeriodAssignmentForm';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionName } = useParams();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [assignedPeriods, setAssignedPeriods] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [schoolId, classId, sectionName]);

  const fetchInitialData = async () => {
    fetchCalendarEventsAndHolidays();
    fetchTeachers();
    fetchTimetableSettings();
    fetchAssignments();
  };

  const fetchCalendarEventsAndHolidays = async () => {
    try {
      const eventsResponse = await axiosInstance.get(`/schools/${schoolId}/calendar`);
      const holidaysResponse = await axiosInstance.get(`/schools/${schoolId}/holidays`);
      setCalendarEvents(eventsResponse.data);
      setHolidays(holidaysResponse.data);
    } catch (error) {
      console.error('Error fetching calendar events and holidays:', error);
      setError('Failed to load calendar events and holidays.');
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to load teachers.');
    }
  };

  const fetchTimetableSettings = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      setTimetableSettings(response.data);
    } catch (error) {
      console.error('Error fetching timetable settings:', error);
      setError('Failed to load timetable settings.');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionName}/assignments`);
      processAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments.');
    }
  };

  const processAssignments = (assignments) => {
    const processed = assignments.reduce((acc, assignment) => {
      const key = `${assignment.day}-${assignment.period}`;
      acc[key] = {
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        teacherName: teachers.find(t => t.id === assignment.teacherId)?.name || 'Unknown',
        subjectName: subjects.find(s => s.id === assignment.subjectId)?.subjectName || 'Unknown'
      };
      return acc;
    }, {});
    setAssignedPeriods(processed);
  };

  const handleOpenModal = (day, period) => {
    setIsModalOpen(true);
    setSelectedPeriod({ day, period });
    const assignment = assignedPeriods[`${day}-${period}`];
    if (assignment) {
      setSelectedTeacher(assignment.teacherId);
      setSelectedSubject(assignment.subjectId);
    } else {
      setSelectedTeacher('');
      setSelectedSubject('');
    }
  };

  const handleAssignPeriod = async (teacherId, subjectId) => {
    const day = selectedPeriod.day;
    const period = selectedPeriod.period;
    try {
      await axiosInstance.post('/timetable/assign', {
        schoolId,
        classId,
        sectionName,
        day,
        period,
        teacherId,
        subjectId
      });
      fetchAssignments(); // Refresh data
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error assigning period:', error);
      setError('Error assigning period.');
    }
  };

  return (
    <div className="MSchoolClassSection">
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <PeriodAssignmentForm
          teachers={teachers}
          subjects={subjects}
          onAssign={(e) => {
            e.preventDefault();
            handleAssignPeriod(selectedTeacher, selectedSubject);
          }}
          selectedTeacher={selectedTeacher}
          setSelectedTeacher={setSelectedTeacher}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      </Modal>
    </div>
  );
};

export default MSchoolClassSection;
