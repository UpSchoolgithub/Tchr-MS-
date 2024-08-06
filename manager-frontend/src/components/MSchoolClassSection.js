import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import axiosInstance from '../services/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MSchoolClassSection.css';
import PeriodAssignmentForm from './PeriodAssignmentForm';

Modal.setAppElement('#root');

const MSchoolClassSection = () => {
  const { schoolId, classId, sectionName } = useParams();
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableSettings, setTimetableSettings] = useState(null);
  const [assignedPeriods, setAssignedPeriods] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState({});
  const [isEditWarningOpen, setIsEditWarningOpen] = useState(false);
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
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/teachers`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchTimetableSettings = async () => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/timetable`);
      setTimetableSettings(response.data);
    } catch (error) {
      console.error('Error fetching timetable settings:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axiosInstance.get(`/timetable/${schoolId}/${classId}/${sectionName}/assignments`);
      const assignments = processAssignments(response.data);
      setAssignedPeriods(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const processAssignments = (data) => {
    return data.reduce((acc, entry) => {
      const teacher = teachers.find(t => t.id === entry.teacherId) || { name: 'Unknown' };
      const subject = subjects.find(s => s.id === entry.subjectId) || { name: 'Unknown' };
      acc[`${entry.day}-${entry.period}`] = `${teacher.name} (${subject.name})`;
      return acc;
    }, {});
  };

  const handleOpenModal = (day, period) => {
    setSelectedPeriod({ day, period });
    setIsModalOpen(true);
  };

  const handleAssignPeriod = async (teacherId, subjectId) => {
    try {
      const payload = {
        schoolId,
        classId,
        sectionName,
        day: selectedPeriod.day,
        period: selectedPeriod.period,
        teacherId,
        subjectId
      };
      await axiosInstance.post('/timetable/assign', payload);
      fetchAssignments();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error assigning period:', error);
    }
  };

  return (
    <div className="MSchoolClassSection">
      {/* Rest of the UI and logic to display timetable and handle user interactions */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <PeriodAssignmentForm
          teachers={teachers}
          subjects={subjects}
          onAssign={handleAssignPeriod}
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
