import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [className, setClassName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [sections, setSections] = useState([]); // Sections for the selected class
  const [newSectionName, setNewSectionName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [error, setError] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [tempDates, setTempDates] = useState({});

  const getSubjects = (className) => {
    return parseInt(className, 10) <= 7
      ? ['Science', 'Math', 'Social', 'English', 'Kannada', 'Hindi']
      : ['Chemistry', 'Biology', 'Physics', 'Mathematics', 'Social', 'English', 'Hindi', 'Kannada'];
  };

  const fetchClassInfos = async () => {
    try {
      const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}/classes`);
      setClassInfos(response.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error fetching class data');
    }
  };

  const fetchSections = async (classId) => {
    try {
      const response = await axios.get(`https://tms.up.school/api/classes/${classId}/sections`);
      setSections(response.data); // Update sections state with fetched data
    } catch (error) {
      console.error('Error fetching sections:', error);
      setError('Error fetching sections');
    }
  };

  useEffect(() => {
    fetchClassInfos();
  }, [schoolId]);

  const handleClassSubmit = async () => {
    if (newClassName) {
      try {
        await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, { className: newClassName });
        setNewClassName('');
        fetchClassInfos(); // Refresh class infos
      } catch (error) {
        console.error('Error adding class:', error);
        setError('Failed to add class. Please try again.');
      }
    }
  };

  const handleSectionSubmit = async () => {
    const selectedClass = classInfos.find(cls => cls.className === className);
    if (!selectedClass) {
      setError('Please select a valid class to add a section.');
      return;
    }

    try {
      await axios.post(`https://tms.up.school/api/classes/${selectedClass.id}/sections`, {
        sections: { [newSectionName.toUpperCase()]: { subjects: [] } }, // Ensure uppercase section name
        schoolId
      });
      setNewSectionName('');
      fetchSections(selectedClass.id); // Refresh sections list for the selected class
    } catch (error) {
      console.error('Error adding section:', error);
      setError('Failed to add section. Please try again.');
    }
  };

  const handleClassChange = async (selectedClassName) => {
    setClassName(selectedClassName);
    const selectedClass = classInfos.find(cls => cls.className === selectedClassName);
    if (selectedClass) {
      fetchSections(selectedClass.id); // Fetch sections for the selected class
    } else {
      setSections([]); // Clear sections if no class is selected
    }
  };

  const handleSectionSubjectSubmit = async (e) => {
    e.preventDefault();

    if (new Date(academicStartDate) >= new Date(academicEndDate) ||
        new Date(academicEndDate) >= new Date(revisionStartDate) ||
        new Date(revisionStartDate) >= new Date(revisionEndDate)) {
      alert('Please ensure dates are in the correct order.');
      return;
    }

    try {
      const selectedClass = classInfos.find(cls => cls.className === className);
      const selectedSection = sections.find(sec => sec.sectionName === section);

      if (!selectedClass || !selectedSection) {
        setError('Please select a valid class and section.');
        return;
      }

      const newSubject = {
        subjectName: subject,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate,
      };

      await axios.post(`https://tms.up.school/api/classes/${selectedClass.id}/sections`, {
        sections: { [section.toUpperCase()]: { subjects: [newSubject] } }, // Ensure uppercase section name
        schoolId
      });

      fetchClassInfos();
      resetForm();
    } catch (error) {
      console.error('Error adding subject:', error);
      setError('Failed to add subject. Please try again.');
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

  return (
    <div>
      {error && <div className="error">{error}</div>}
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
          {[...new Set(classInfos.map((info) => info.className))].map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      <div>
        <input
          type="text"
          placeholder="Enter new section"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
        />
        <button onClick={handleSectionSubmit}>Add New Section</button>
      </div>

      <form onSubmit={handleSectionSubjectSubmit}>
        <div>
          <label>Section:</label>
          <select value={section} onChange={(e) => setSection(e.target.value)} required>
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.sectionName}>{sec.sectionName}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Subject:</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">Select Subject</option>
            {getSubjects(className).map((subj) => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Academic Start Date:</label>
          <input type="date" value={academicStartDate} onChange={(e) => setAcademicStartDate(e.target.value)} required />
        </div>
        <div>
          <label>Academic End Date:</label>
          <input type="date" value={academicEndDate} onChange={(e) => setAcademicEndDate(e.target.value)} required />
        </div>
        <div>
          <label>Revision Start Date:</label>
          <input type="date" value={revisionStartDate} onChange={(e) => setRevisionStartDate(e.target.value)} required />
        </div>
        <div>
          <label>Revision End Date:</label>
          <input type="date" value={revisionEndDate} onChange={(e) => setRevisionEndDate(e.target.value)} required />
        </div>
        <button type="submit">Add Section and Subject</button>
      </form>
    </div>
  );
};

export default ClassInfo;
