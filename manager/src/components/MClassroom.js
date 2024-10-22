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

  // Fetch sections and subjects for the selected class
  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(cls => cls.classInfo.some(info => info.id === selectedClass));
      if (classData) {
        fetchSections(classData.classInfo);
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

  const fetchSections = async (classInfoList) => {
    try {
      const sectionRequests = classInfoList.map(classInfo =>
        axiosInstance.get(`/classes/${classInfo.id}/sections`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      const sectionResponses = await Promise.all(sectionRequests);
      const allSections = sectionResponses.flatMap(response => response.data);
  
      console.log('Fetched Sections:', allSections); // Add this line to see the response in the console
  
      const sectionsGrouped = allSections.reduce((acc, section) => {
        if (!acc[section.sectionName]) {
          acc[section.sectionName] = [];
        }
        acc[section.sectionName].push(section);
        return acc;
      }, {});
  
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
  
      const sectionsWithSubjects = await Promise.all(Object.keys(sectionsGrouped).map(async sectionName => {
        const sectionInfo = sectionsGrouped[sectionName];
        const subjects = await Promise.all(sectionInfo.map(section => fetchSubjects(section.id)));
        const combinedSubjects = subjects.flat();
        return {
          sectionName,
          sectionInfo,
          count: sectionInfo.length,
          subjects: combinedSubjects,
          sectionId: sectionInfo[0]?.id  // Directly use sectionId here
        };
      }));
  
      setSections(sectionsWithSubjects);
    } catch (error) {
      console.error('Error fetching sections:', error);
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
    const classId = e.target.value;  // Use classId instead of className
    const classData = classes.find(cls => cls.classInfo.some(info => info.id === classId)); // Adjust logic if needed to find class by ID
    if (classData) {
      const classInfoList = classData.classInfo;
      setSelectedClass(classId); // Use classId for state management
      localStorage.setItem('selectedClass', classId); // Store classId in local storage
      fetchSections(classInfoList); // Pass classInfo to fetch sections
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
      }
      navigate(`/dashboard/school/${selectedSchool}/class/${selectedClass}/section/${selectedSectionInfo.sectionId}`, {  // Use sectionId for navigation
        state: {
          selectedSchool,
          selectedClass,
          selectedSection,
          subjects: selectedSectionInfo ? selectedSectionInfo.subjects : [],
          sectionId: selectedSectionInfo ? selectedSectionInfo.sectionId : ''
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
              <option key={cls.className} value={cls.classInfo[0].id}>
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
                {section.sectionName} ({section.count})
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
