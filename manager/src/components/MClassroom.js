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
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClass') || null);
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
    if (selectedClass) {
      const classData = classes.find(cls => cls.className === selectedClass);
      if (classData) {
        const classId = classData.classInfo.length > 0 ? classData.classInfo[0].id : null;
        if (classId) {
          fetchSections(classId);
        }
      }
    }
  }, [selectedClass, classes]);

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
      console.log("Fetching sections for classId:", classId);
      const response = await axiosInstance.get(`/classes/${classId}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Fetched sections:", response.data);
      const sections = response.data;
      
      const sectionsWithSubjects = await Promise.all(sections.map(async section => {
        const subjects = await fetchSubjects(section.id);
        return {
          sectionName: section.sectionName,
          sectionId: section.id,
          subjects
        };
      }));

      console.log("Processed sections with subjects:", sectionsWithSubjects);
      setSections(sectionsWithSubjects);
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
      return response.data;
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
    setSelectedClass(null);
    setSelectedSection(null);
    localStorage.removeItem('selectedClass');
    localStorage.removeItem('selectedSection');
  };

  const handleClassChange = (e) => {
    const className = e.target.value;
    const classData = classes.find(cls => cls.className === className);
    if (classData) {
      const classId = classData.classInfo.length > 0 ? classData.classInfo[0].id : null;
      setSelectedClass(className);
      localStorage.setItem('selectedClass', className);

      if (classId) {
        fetchSections(classId);
      }
      
      setSections([]);
      setSelectedSection(null);
      localStorage.removeItem('selectedSection');
    }
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
    localStorage.setItem('selectedSection', e.target.value);
  };

  const handleSectionSelect = () => {
    if (selectedSchool && selectedClass && selectedSection) {
      const selectedSectionInfo = sections.find(section => section.sectionName === selectedSection);
      if (selectedSectionInfo) {
        localStorage.setItem('selectedSubjects', JSON.stringify(selectedSectionInfo.subjects));
        localStorage.setItem('combinedSectionId', selectedSectionInfo.sectionId); // Store section ID
      }
      navigate(`/dashboard/school/${selectedSchool}/class/${selectedClass}/section/${selectedSection}`, {
        state: {
          selectedSchool,
          selectedClass,
          selectedSection,
          subjects: selectedSectionInfo ? selectedSectionInfo.subjects : [],
          combinedSectionId: selectedSectionInfo ? selectedSectionInfo.sectionId : ''
        }
      });
    }
  };

  const selectedSectionInfo = sections.find(section => section.sectionName === selectedSection);

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
          <select onChange={handleClassChange} value={selectedClass || ''} disabled={!selectedSchool}>
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
          <select onChange={handleSectionChange} value={selectedSection || ''} disabled={!selectedClass}>
            <option value="" disabled>Select Section</option>
            {sections.map((section) => (
              <option key={section.sectionId} value={section.sectionName}>
                {section.sectionName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h3>Subjects:</h3>
          {selectedSectionInfo && (
            <div className="subjects-container">
              {selectedSectionInfo.subjects.length > 0 ? (
                selectedSectionInfo.subjects.map(subject => (
                  <div key={subject.id} className="subject-item">
                    <span>{subject.subjectName || 'No Subject Name'}</span>
                  </div>
                ))
              ) : (
                <p>No subjects found for this section.</p>
              )}
            </div>
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
