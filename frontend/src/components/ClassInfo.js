import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId, schoolName } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [className, setClassName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(''); // State for board selection

  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [tempDates, setTempDates] = useState({});
  const [error, setError] = useState('');

  const boardOptions = ['ICSE', 'CBSE', 'STATE']; // Board options

  const getSubjects = (className) => {
    return parseInt(className, 10) <= 7
      ? ['Science', 'Math', 'Social', 'English', 'Kannada', 'Hindi']
      : ['Chemistry', 'Biology', 'Physics', 'Mathematics', 'Social', 'English', 'Hindi', 'Kannada'];
  };

  const fetchClassInfos = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}/classes`);
      console.log('Class Info Response:', response.data); // Log API response
      const formattedClasses = response.data.map((cls) => ({
        ...cls,
        displayName: `${cls.board} - ${cls.className}`,
      }));
      setClassInfos(formattedClasses);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error fetching class data');
    }
  };
  
  
  
  

  const fetchSections = async (classId) => {
    try {
      const response = await axios.get(`https://tms.up.school/api/classes/${classId}/sections`);
      const selectedClass = classInfos.find((cls) => cls.id === classId); // Find the class name
      const updatedSections = response.data.map((section) => ({
        ...section,
        displayName: `${selectedClass.className} - ${selectedBoard} - ${section.sectionName}`, // Format with class name
      }));
      setSections(updatedSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError('Error fetching sections');
    }
  };
  
  

  useEffect(() => {
    fetchClassInfos();
  }, [schoolId]);

  const handleClassSubmit = async () => {
    if (!newClassName || !selectedBoard) {
      setError('Please provide a class name and select a board.');
      return;
    }

    try {
      await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, {
        className: newClassName,
        board: selectedBoard, // Include board in the payload
      });
      setNewClassName('');
      setSelectedBoard(''); // Reset board selection
      fetchClassInfos();
    } catch (error) {
      console.error('Error adding class:', error);
      setError('Failed to add class. Please try again.');
    }
  };

  const handleSectionSubmit = async () => {
    const selectedClass = classInfos.find(
      (cls) => `${cls.board} - ${cls.className}` === className
    );
  
    if (!selectedClass) {
      setError('Please select a valid class to add a section.');
      return;
    }
  
    try {
      await axios.post(`https://tms.up.school/api/classes/${selectedClass.id}/sections`, {
        sections: { [newSectionName.toUpperCase()]: { subjects: [] } },
        schoolId,
      });
      setNewSectionName('');
      fetchSections(selectedClass.id);
    } catch (error) {
      console.error('Error adding section:', error);
      setError('Failed to add section. Please try again.');
    }
  };
  

  const handleClassChange = (selectedClassName) => {
    setClassName(selectedClassName);
  
    // Find the selected class based on the class name
    const selectedClass = classInfos.find(
      (cls) => `${cls.board} - ${cls.className}` === selectedClassName
    );
  
    if (selectedClass) {
      setSelectedBoard(selectedClass.board); // Set the correct board
      fetchSections(selectedClass.id); // Fetch sections for the selected class
    } else {
      setSelectedBoard(''); // Clear board if no class is selected
      setSections([]); // Clear sections if no class is selected
    }
  };
  
  

  const handleSectionSubjectSubmit = async (e) => {
    e.preventDefault();
  
    // Validate date order
    if (
      new Date(academicStartDate) >= new Date(academicEndDate) ||
      new Date(academicEndDate) >= new Date(revisionStartDate) ||
      new Date(revisionStartDate) >= new Date(revisionEndDate)
    ) {
      setError('Please ensure dates are in the correct order.');
      return;
    }
  
    // Find selected class
    const selectedClass = classInfos.find(
      (cls) => `${cls.board} - ${cls.className}` === className
    );
  
    // Find selected section
    const selectedSection = sections.find(
      (sec) => `${selectedBoard} - ${sec.sectionName}` === section
    );
  
    if (!selectedClass || !selectedSection) {
      console.error('Debug Info:', { selectedClass, selectedSection, className, section });
      setError('Please select a valid class and section.');
      return;
    }
    
  
    try {
      // Prepare subject data
      const newSubject = {
        subjectName: subject,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate,
      };
  
      // API call to add subject to the section
      await axios.post(`https://tms.up.school/api/classes/${selectedClass.id}/sections`, {
        sections: { [selectedSection.sectionName.toUpperCase()]: { subjects: [newSubject] } },
        schoolId,
      });
  
      fetchClassInfos(); // Refresh data
      resetForm(); // Reset form fields
      setError('');
    } catch (error) {
      console.error('Error adding subject:', error);
      setError('Failed to add subject. Please try again.');
    }
  };
  
  
  
  

  const handleEditClick = (subjectId, academicStart, academicEnd, revisionStart, revisionEnd) => {
    setEditingSubject(subjectId);
    setTempDates({
      academicStartDate: academicStart,
      academicEndDate: academicEnd,
      revisionStartDate: revisionStart,
      revisionEndDate: revisionEnd,
    });
  };

  const handleSaveClick = async (classId, sectionId, subjectId) => {
    try {
      await axios.put(
        `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}`,
        tempDates
      );
      setEditingSubject(null);
      fetchClassInfos();
    } catch (error) {
      console.error('Error saving subject:', error);
      setError('Failed to save the subject. Please try again.');
    }
  };

  const handleDeleteClick = async (classId, sectionId, subjectId) => {
    try {
      await axios.delete(
        `https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}`
      );
      fetchClassInfos();
    } catch (error) {
      console.error('Error deleting subject:', error);
      setError('Failed to delete the subject. Please try again.');
    }
  };

  const resetForm = () => {
    setSection('');
    setSubject('');
    setAcademicStartDate('');
    setAcademicEndDate('');
    setRevisionStartDate('');
    setRevisionEndDate('');
  };

  const [filters, setFilters] = useState({
    class: '',
    board: '',
    section: '',
    subject: '',
  });
  
  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
    console.log("Filters Updated:", { ...filters, [name]: value }); // Debugging
  };
  
  
  // Filter data based on selected filters
  const filteredClassInfos = classInfos.filter((info) => {
    const matchesClass = filters.class ? info.className === filters.class : true;
    const matchesBoard = filters.board ? info.board === filters.board : true;
    const matchesSection = filters.section
      ? Object.keys(info.sections || {}).includes(filters.section)
      : true;
    const matchesSubject = filters.subject
      ? Object.keys(info.sections || {}).some((sec) =>
          info.sections[sec].subjects.some((sub) => sub.subjectName === filters.subject)
        )
      : true;
  
    return matchesClass && matchesBoard && matchesSection && matchesSubject;
  });
  

// Debugging
console.log("Filtered Data:", filteredClassInfos);
console.log("Filters Applied:", filters);

//const AddNewClassSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}

{/* Toggle Button for Expandable Section */}
<button
  onClick={toggleExpanded}
  style={{
    padding: '10px 20px',
    backgroundColor: isExpanded ? 'red' : 'green',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '10px',
  }}
>
  {isExpanded ? 'Close Add New Class' : 'Add New Class'}
</button>

{/* Expandable Section */}
{isExpanded && (
  <div
    style={{
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
      marginBottom: '20px',
    }}
  >
    {/* Board Selection */}
    <div>
      <label>Select Board:</label>
      <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
        <option value="">Select Board</option>
        {boardOptions.map((board) => (
          <option key={board} value={board}>
            {board}
          </option>
        ))}
      </select>
    </div>

    {/* Class Input and Selection */}
    <div>
      <input
        type="text"
        placeholder="Enter new class"
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <button onClick={handleClassSubmit}>Add New Class</button>
      <span> Or Select Existing Class:</span>
      <select value={className} onChange={(e) => handleClassChange(e.target.value)}>
        <option value="">Select Class</option>
        {classInfos.map((info) => (
          <option key={info.id} value={`${info.board} - ${info.className}`}>
            {info.displayName}
          </option>
        ))}
      </select>
    </div>

    {/* Section Input */}
    <div>
      <input
        type="text"
        placeholder="Enter new section"
        value={newSectionName}
        onChange={(e) => setNewSectionName(e.target.value)}
      />
      <button onClick={handleSectionSubmit}>Add New Section</button>
    </div>

    {/* Subject Form */}
    <form onSubmit={handleSectionSubjectSubmit}>
      <div>
        <label>Section:</label>
        <select value={section} onChange={(e) => setSection(e.target.value)} required>
          <option value="">Select Section</option>
          {sections.map((sec) => (
            <option key={sec.id} value={`${selectedBoard} - ${sec.sectionName}`}>
              {sec.displayName} {/* Updated display */}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Subject:</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
          <option value="">Select Subject</option>
          {getSubjects(className).map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Academic Start Date:</label>
        <input
          type="date"
          value={academicStartDate}
          onChange={(e) => setAcademicStartDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Academic End Date:</label>
        <input
          type="date"
          value={academicEndDate}
          onChange={(e) => setAcademicEndDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Revision Start Date:</label>
        <input
          type="date"
          value={revisionStartDate}
          onChange={(e) => setRevisionStartDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Revision End Date:</label>
        <input
          type="date"
          value={revisionEndDate}
          onChange={(e) => setRevisionEndDate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Section and Subject</button>
    </form>
    </div>
      )}

      
{/*} filters for table */}
<div>
  <h3>Filters</h3>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div>
      <label>Class:</label>
      <select
        name="class"
        value={filters.class}
        onChange={handleFilterChange}
        style={{ marginLeft: "5px" }}
      >
        <option value="">Select Class</option>
        {classInfos.map((info) => (
          <option key={info.className} value={info.className}>
            {info.className}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label>Board:</label>
      <select
        name="board"
        value={filters.board}
        onChange={handleFilterChange}
        style={{ marginLeft: "5px" }}
      >
        <option value="">Select Board</option>
        {[...new Set(classInfos.map((info) => info.board))].map((board) => (
          <option key={board} value={board}>
            {board}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label>Section:</label>
      <select
        name="section"
        value={filters.section}
        onChange={handleFilterChange}
        style={{ marginLeft: "5px" }}
      >
        <option value="">Select Section</option>
        {classInfos
          .flatMap((info) => Object.keys(info.sections || {}))
          .filter((value, index, self) => self.indexOf(value) === index) // Unique sections
          .map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
      </select>
    </div>

    <div>
      <label>Subject:</label>
      <select
        name="subject"
        value={filters.subject}
        onChange={handleFilterChange}
        style={{ marginLeft: "5px" }}
      >
        <option value="">Select Subject</option>
        {classInfos
          .flatMap((info) =>
            Object.keys(info.sections || {}).flatMap((sec) =>
              info.sections[sec].subjects.map((sub) => sub.subjectName)
            )
          )
          .filter((value, index, self) => self.indexOf(value) === index) // Unique subjects
          .map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
      </select>
    </div>

    <button
      onClick={() => setFilters({ class: "", board: "", section: "", subject: "" })}
      style={{
        marginLeft: "10px",
        padding: "5px 10px",
        backgroundColor: "grey",
        color: "white",
        border: "none",
        cursor: "pointer",
      }}
    >
      Clear Filters
    </button>
  </div>
</div>


      {/* Class, Section, and Subject Details */}
      <div>
        <h2>Class, Section, and Subject Details:</h2>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Board</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Academic Start Date</th>
              <th>Academic End Date</th>
              <th>Revision Start Date</th>
              <th>Revision End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
  {filteredClassInfos.map((info) =>
    Object.keys(info.sections || {}).map((sec) =>
      info.sections[sec].subjects.map((subject) => (
        <tr key={subject.id}>
          <td>{info.className}</td>
          <td>{info.board}</td>
          <td>{sec}</td>
          <td>{subject.subjectName}</td>
          <td>{new Date(subject.academicStartDate).toLocaleDateString()}</td>
          <td>{new Date(subject.academicEndDate).toLocaleDateString()}</td>
          <td>{new Date(subject.revisionStartDate).toLocaleDateString()}</td>
          <td>{new Date(subject.revisionEndDate).toLocaleDateString()}</td>
          <td>
            <button
              onClick={() => {
                const sectionData = info.sections[sec];
                navigate(
                  `/schools/${schoolId}/classes/${info.id}/sections/${sectionData.id}/subjects/${subject.id}/sessions`,
                  {
                    state: {
                      schoolName,
                      className: info.className,
                      sectionName: sec,
                      subjectName: subject.subjectName,
                      board: info.board,
                    },
                  }
                );
              }}
            >
              Manage Sessions
            </button>
          </td>
        </tr>
      ))
    )
  )}
</tbody>


        </table>
      </div>
    </div>
  );
};

export default ClassInfo;
