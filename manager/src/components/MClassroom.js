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
  const [availableBoards, setAvailableBoards] = useState([]);
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
  
      // Group classes by name
      const classesGrouped = response.data.reduce((acc, curr) => {
        if (!acc[curr.className]) acc[curr.className] = [];
        acc[curr.className].push(curr);
        return acc;
      }, {});
  
      // Process grouped classes
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
  
  useEffect(() => {
    if (selectedClassId) {
      fetchSections(selectedClassId);
    }
  }, [selectedClassId]);
  
  const fetchSections = async (classId) => {
    try {
      const response = await axiosInstance.get(`/classes/${classId}/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Sections:", response.data); // Log sections
      const sections = response.data.map((section) => ({
        sectionName: section.sectionName,
        sectionId: section.id,
      }));
      setSections(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
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
  
    // Fetch classes for the selected school and board
    if (selectedSchool) {
      fetchClasses(selectedSchool, board);
    }
  };
  
  


const handleSchoolChange = async (e) => {
  const schoolId = e.target.value;
  setSelectedSchool(schoolId);

  // Reset dependent states
  setClasses([]);
  setAvailableBoards([]);
  setSections([]);
  setSubjects([]);
  setSelectedClassId('');
  setSelectedSection('');
  setSelectedBoard('');

  try {
    const response = await axiosInstance.get(`/schools/${schoolId}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Extract unique boards for the selected school
    const uniqueBoards = [...new Set(response.data.map((cls) => cls.board))];
    setAvailableBoards(uniqueBoards);
  } catch (error) {
    console.error('Error fetching boards:', error);
  }
};

  

const handleClassChange = (e) => {
  const classId = e.target.value; // Use class ID directly from the value
  const classData = classes.find((cls) =>
    cls.classInfo.some((info) => info.id === parseInt(classId))
  );

  if (classData) {
    setSelectedClassId(classId);
    setSelectedClassName(classData.className);
    fetchSections(classId); // Fetch sections using classId
  }
};



const handleSectionChange = async (e) => {
  const sectionId = e.target.value;
  setSelectedSection(sectionId);

  if (!sectionId) {
    console.error("Invalid section ID:", sectionId);
    return;
  }

  try {
    const response = await axiosInstance.get(`/sections/${sectionId}/subjects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Subjects Response:", response.data);
    setSubjects(response.data);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    setSubjects([]);
    alert("Failed to load subjects. Please try again.");
  }
};

  
  
  
const handleSectionSelect = () => {
  if (!sections || !sections.length) {
    console.error("Sections data is empty. Cannot proceed.");
    return;
  }

  const sectionData = sections.find(
    (section) => String(section.sectionId) === String(selectedSection)
  );

  if (sectionData) {
    console.log("Navigating with:", {
      selectedSchool,
      selectedClassId,
      sectionId: sectionData.sectionId,
    });

    navigate(
      `/dashboard/school/${selectedSchool}/class/${selectedClassId}/section/${sectionData.sectionId}`,
      {
        state: {
          selectedSchool,
          selectedClass: selectedClassId,
          selectedSection: sectionData.sectionId,
        },
      }
    );
  } else {
    console.error("Section data not found for ID:", selectedSection);
  }
};


  
  

  return (
    <div className="container">
      <div className="classroom-container">
        <h1>Select Board, School, Class, and Section</h1>

        

        {/* School Selection */}
        <div className="form-group">
  <label>School:</label>
  <select onChange={handleSchoolChange} value={selectedSchool || ''}>
    <option value="" disabled>Select School</option>
    {schools.map((school) => (
      <option key={school.id} value={school.id}>
        {school.name}
      </option>
    ))}
  </select>
</div>

<div className="form-group">
  <label>Board:</label>
  <select onChange={handleBoardChange} value={selectedBoard || ''} disabled={!availableBoards.length}>
    <option value="" disabled>Select Board</option>
    {availableBoards.map((board) => (
      <option key={board} value={board}>
        {board}
      </option>
    ))}
  </select>
</div>

<div className="form-group">
  <label>Class:</label>
  <select onChange={handleClassChange} value={selectedClassId || ''} disabled={!selectedBoard}>
  <option value="" disabled>Select Class</option>
  {classes.map((cls) => (
    <option key={cls.classInfo[0]?.id} value={cls.classInfo[0]?.id}>
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
    <option key={section.sectionId} value={section.sectionId}>
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
        {subject.subjectName || 'No Subject Name'}
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
