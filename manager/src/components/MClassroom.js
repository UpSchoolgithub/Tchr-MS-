import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';
import './MClassroom.css';

const MClassroom = () => {
  const { managerId, token } = useManagerAuth();
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');

  const navigate = useNavigate();

  // Fetch Schools when managerId is available
  useEffect(() => {
    if (!managerId || !token) return;

    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get(`/managers/${managerId}/schools`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, [managerId, token]);

  // Fetch Classes when School and Board are selected
  useEffect(() => {
    if (selectedSchool && selectedBoard) {
      fetchClasses(selectedSchool, selectedBoard);
    }
  }, [selectedSchool, selectedBoard]);

  const fetchClasses = async (schoolId, board) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes?board=${board}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classesGrouped = response.data.reduce((acc, curr) => {
        if (!acc[curr.className]) acc[curr.className] = [];
        acc[curr.className].push(curr);
        return acc;
      }, {});
      const processedClasses = Object.keys(classesGrouped).map((className) => ({
        className,
        classInfo: classesGrouped[className],
        count: classesGrouped[className].length,
      }));
      setClasses(processedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const response = await axiosInstance.get(`/classes/${classId}/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(response.data.map((section) => ({ sectionName: section.sectionName, sectionId: section.id })));
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async (sectionId) => {
    try {
      const response = await axiosInstance.get(`/sections/${sectionId}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
    } catch (error) {
      console.error(`Error fetching subjects for section ${sectionId}:`, error);
      setSubjects([]);
    }
  };

  const handleBoardChange = (e) => {
    const board = e.target.value;
    setSelectedBoard(board);

    // Reset dependent dropdowns
    setClasses([]);
    setSections([]);
    setSubjects([]);
    setSelectedClassId('');
    setSelectedSection('');

    if (selectedSchool) {
      fetchClasses(selectedSchool, board);
    }
  };

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);

    // Reset dependent dropdowns
    setClasses([]);
    setSections([]);
    setSubjects([]);
    setSelectedBoard('');
    setSelectedClassId('');
    setSelectedSection('');
  };

  const handleClassChange = (e) => {
    const className = e.target.value;
    const classData = classes.find((cls) => cls.className === className);
    if (classData) {
      const classId = classData.classInfo.length > 0 ? classData.classInfo[0].id : null;
      setSelectedClassId(classId);
      setSelectedClassName(className);
      fetchSections(classId);
    }
  };

  const handleSectionChange = async (e) => {
    const sectionName = e.target.value;
    setSelectedSection(sectionName);

    const sectionData = sections.find((section) => section.sectionName === sectionName);
    if (sectionData) {
      await fetchSubjects(sectionData.sectionId);
    }
  };

  const handleSectionSelect = () => {
    const sectionData = sections.find((section) => section.sectionName === selectedSection);
    if (selectedSchool && selectedClassId && sectionData) {
      navigate(`/dashboard/school/${selectedSchool}/class/${selectedClassId}/section/${sectionData.sectionId}`, {
        state: {
          selectedSchool,
          selectedClass: selectedClassId,
          selectedSection: sectionData.sectionId,
        },
      });
    }
  };

  return (
    <div className="container">
      <div className="classroom-container">
        <h1>Select Board, School, Class, and Section</h1>

        {/* Board Selection */}
        <div className="form-group">
          <label>Board:</label>
          <select onChange={handleBoardChange} value={selectedBoard || ''}>
            <option value="" disabled>Select Board</option>
            <option value="ICSE">ICSE</option>
            <option value="CBSE">CBSE</option>
            <option value="STATE">STATE</option>
          </select>
        </div>

        {/* School Selection */}
        <div className="form-group">
          <label>School:</label>
          <select onChange={handleSchoolChange} value={selectedSchool || ''} disabled={!selectedBoard}>
            <option value="" disabled>Select School</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Selection */}
        <div className="form-group">
          <label>Class:</label>
          <select onChange={handleClassChange} value={selectedClassName || ''} disabled={!selectedSchool}>
            <option value="" disabled>Select Class</option>
            {classes.map((cls) => (
              <option key={cls.className} value={cls.className}>
                {cls.className} ({cls.count})
              </option>
            ))}
          </select>
        </div>

        {/* Section Selection */}
        <div className="form-group">
          <label>Section:</label>
          <select onChange={handleSectionChange} value={selectedSection || ''} disabled={!selectedClassId}>
            <option value="" disabled>Select Section</option>
            {sections.map((section) => (
              <option key={section.sectionId} value={section.sectionName}>
                {section.sectionName}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects */}
        <div>
          <h3>Subjects:</h3>
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <div key={subject.id} className="subject-item">
                {subject.subjectName}
              </div>
            ))
          ) : (
            <p>No subjects found for this section.</p>
          )}
        </div>

        <button onClick={handleSectionSelect} disabled={!selectedSection} className="select-button">
          Select Section
        </button>
      </div>
    </div>
  );
};

export default MClassroom;
