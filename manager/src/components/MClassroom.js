import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';  // Ensure your axiosInstance is set up with the correct baseURL and token handling
import { useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';
import './MClassroom.css'; // Import any necessary CSS

const MClassroom = () => {
  const { managerId, token } = useManagerAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(localStorage.getItem('selectedSchool') || null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]); // State for subjects
  const [selectedClassId, setSelectedClassId] = useState(null); // State for selected class ID
  const [selectedClassName, setSelectedClassName] = useState(null); // State for selected class name
  const [selectedSection, setSelectedSection] = useState(localStorage.getItem('selectedSection') || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!managerId || !token) {
      console.log("Manager ID or token is not available");
      return;
    }

    // Fetch schools tagged to the manager
    const fetchSchools = async () => {
      try {
        const response = await axiosInstance.get(`/managers/${managerId}/schools`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSchools(response.data);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, [managerId, token]);

  // Fetch classes for the selected school
  useEffect(() => {
    if (selectedSchool) {
      fetchClasses(selectedSchool);
    }
  }, [selectedSchool]);

  // Fetch sections for the selected class
  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchClasses = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const classesGrouped = response.data.reduce((acc, curr) => {
        if (!acc[curr.className]) {
          acc[curr.className] = [];
        }
        acc[curr.className].push(curr);
        return acc;
      }, {});
      const processedClasses = Object.keys(classesGrouped).map(className => ({
        className,
        classInfo: classesGrouped[className],
        count: classesGrouped[className].length
      }));
      setClasses(processedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const response = await axiosInstance.get(`/classes/${classId}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const sections = response.data.map(section => ({
        sectionName: section.sectionName,
        sectionId: section.id,
      }));
      setSections(sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async (sectionId) => {
    try {
      const response = await axiosInstance.get(`/sections/${sectionId}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data; // Return subjects from response
    } catch (error) {
      console.error(`Error fetching subjects for section ${sectionId}:`, error);
      return [];
    }
  };

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);
    localStorage.setItem('selectedSchool', schoolId);
    setClasses([]);
    setSections([]);
    setSubjects([]); // Clear subjects when changing school
    setSelectedClassId(null);
    setSelectedSection(null);
    localStorage.removeItem('selectedClass');
    localStorage.removeItem('selectedSection');
  };

  const handleClassChange = (e) => {
    const className = e.target.value;
    const classData = classes.find(cls => cls.className === className);
    if (classData) {
      const classId = classData.classInfo.length > 0 ? classData.classInfo[0].id : null;
      setSelectedClassId(classId); // Set selected class as ID
      setSelectedClassName(className); // Store selected class name
      localStorage.setItem('selectedClass', classId); // Store class ID in localStorage
      fetchSections(classId);
      setSections([]);
      setSelectedSection(null);
      setSubjects([]); // Clear subjects when changing class
      localStorage.removeItem('selectedSection');
    }
  };

  // Fetch subjects in handleSectionChange
  const handleSectionChange = async (e) => {
    const sectionName = e.target.value;
    setSelectedSection(sectionName);
    localStorage.setItem('selectedSection', sectionName);
  
    // Fetch subjects for the selected section
    const selectedSectionInfo = sections.find(section => section.sectionName === sectionName);
    if (selectedSectionInfo) {
      const subjects = await fetchSubjects(selectedSectionInfo.sectionId);
      setSubjects(subjects); // Update state with fetched subjects
    }
  };

  const handleSectionSelect = () => {
    if (selectedSchool && selectedClassId && selectedSection) {
      const selectedSectionInfo = sections.find(section => section.sectionName === selectedSection);
      navigate(`/dashboard/school/${selectedSchool}/class/${selectedClassId}/section/${selectedSectionInfo.sectionId}`, {
        state: {
          selectedSchool,
          selectedClass: selectedClassId,
          selectedSection: selectedSectionInfo.sectionId, // Use section ID instead of name
          combinedSectionId: selectedSectionInfo ? selectedSectionInfo.sectionId : ''
        }
      });
    }
  };

  const selectedSectionInfo = selectedSection ? sections.find(section => section.sectionName === selectedSection) : null;

  return (
    <div className="container">
      <div className="classroom-container">
        <h1>Select School, Class, and Section</h1>
        <div className="form-group">
          <label>School:</label>
          <select onChange={handleSchoolChange} value={selectedSchool || ''}>
            <option value="" disabled>Select School</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </div>
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
        
        {/* Render subjects */}
        <div>
          <h3>Subjects:</h3>
          {subjects.length > 0 ? (
            subjects.map(subject => (
              <div key={subject.id} className="subject-item">
                <span>{subject.subjectName || 'No Subject Name'}</span>
              </div>
            ))
          ) : (
            <p>No subjects found for this section.</p>
          )}
        </div>
        
        <button 
          onClick={handleSectionSelect} 
          disabled={!selectedSection} 
          className="select-button"
        >
          Select Section
        </button>
      </div>
    </div>
  );
};

export default MClassroom;
