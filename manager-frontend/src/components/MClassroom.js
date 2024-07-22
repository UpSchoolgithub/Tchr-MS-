import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useManagerAuth } from '../context/ManagerAuthContext';

const MClassroom = () => {
  const { managerId, token } = useManagerAuth();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [combinedClassSections, setCombinedClassSections] = useState([]);
  const [selectedClassSection, setSelectedClassSection] = useState('');
  const [error, setError] = useState(null);  // State to store error message
  const navigate = useNavigate();

  useEffect(() => {
    if (!managerId || !token) {
      console.log("Manager ID or token is not available");
      return;
    }

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
        setError('Failed to fetch schools.');  // Set error message
      }
    };

    fetchSchools();
  }, [managerId, token]);

  const fetchCombinedClassSections = async (schoolId) => {
    try {
      const response = await axiosInstance.get(`/schools/${schoolId}/classes-sections-subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const uniqueClassSections = {};

      response.data.forEach(item => {
        const key = `${item.className}-${item.sectionName}`;
        if (!uniqueClassSections[key]) {
          uniqueClassSections[key] = {
            className: item.className,
            sectionName: item.sectionName
          };
        }
      });

      const combinedClassSections = Object.values(uniqueClassSections).map(item => ({
        ...item
      }));

      setCombinedClassSections(combinedClassSections);
    } catch (error) {
      console.error('Error fetching combined classes and sections:', error);
      setError('Failed to fetch combined classes and sections.');  // Set error message
    }
  };

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    setSelectedSchool(schoolId);
    fetchCombinedClassSections(schoolId);
    setCombinedClassSections([]);
    setSelectedClassSection('');
  };

  const handleClassSectionChange = (e) => {
    setSelectedClassSection(e.target.value);
  };

  const handleSectionSelect = () => {
    if (selectedSchool && selectedClassSection) {
      const [selectedClass, selectedSection] = selectedClassSection.split('-');
      navigate(`/dashboard/school/${selectedSchool}/class/${selectedClass}/section/${selectedSection}`);
    }
  };

  return (
    <div>
      <h1>Select School, Class, and Section</h1>
      {error && <p className="error">{error}</p>}  // Display error message
      <div>
        <label>School:</label>
        <select onChange={handleSchoolChange} value={selectedSchool || ''}>
          <option value="" disabled>Select School</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>{school.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Class & Section:</label>
        <select onChange={handleClassSectionChange} value={selectedClassSection || ''} disabled={!selectedSchool}>
          <option value="" disabled>Select Class & Section</option>
          {combinedClassSections.map((item) => (
            <option key={`${item.className}-${item.sectionName}`} value={`${item.className}-${item.sectionName}`}>
              {item.className} - {item.sectionName}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleSectionSelect} disabled={!selectedClassSection}>Select Section</button>
    </div>
  );
};

export default MClassroom;
