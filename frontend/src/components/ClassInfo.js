import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [className, setClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [error, setError] = useState('');

  const sections = ['A', 'B', 'C', 'D', 'E'];

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
    }
  };

  useEffect(() => {
    fetchClassInfos();
  }, [schoolId]);

  const handleSaveClass = async () => {
    if (!className) return alert('Please enter a valid class name.');
    try {
      const response = await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, { className });
      setClassInfos([...classInfos, response.data]);
      setClassName('');
      alert('Class created successfully. Now you can add sections and subjects.');
    } catch (error) {
      console.error('Error saving class:', error);
      setError('Failed to save class. Please try again.');
    }
  };

  const handleAddSectionAndSubject = async (e) => {
    e.preventDefault();

    const classToUse = selectedClass || className;
    if (!classToUse) return alert('Please select or add a class first.');

    if (new Date(academicStartDate) >= new Date(academicEndDate) ||
        new Date(academicEndDate) >= new Date(revisionStartDate) ||
        new Date(revisionStartDate) >= new Date(revisionEndDate)) {
      alert('Please ensure dates are in the correct order.');
      return;
    }

    try {
      const newSubject = {
        subjectName: subject,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate,
      };
      const response = await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, {
        className: classToUse,
        sections: { [section]: { subjects: [newSubject] } }
      });

      setClassInfos(prevClassInfos => {
        const updatedInfos = [...prevClassInfos];
        const classIndex = updatedInfos.findIndex(info => info.className === classToUse);
        if (classIndex > -1) {
          const sectionData = updatedInfos[classIndex].sections[section] || { subjects: [] };
          sectionData.subjects.push(newSubject);
          updatedInfos[classIndex].sections[section] = sectionData;
        } else {
          updatedInfos.push(response.data);
        }
        return updatedInfos;
      });

      resetForm();
    } catch (error) {
      console.error('Error adding section and subject:', error);
      setError('Failed to add section and subject. Please try again.');
    }
  };

  const resetForm = () => {
    setSection('');
    setSubject('');
    setAcademicStartDate('');
    setAcademicEndDate('');
    setRevisionStartDate('');
    setRevisionEndDate('');
    setSelectedClass('');
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {/* Add New Class */}
      <div>
        <label>New Class:</label>
        <input
          type="number"
          min="1"
          max="10"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="Enter Class (1-10)"
        />
        <button onClick={handleSaveClass}>Save Class</button>
      </div>

      {/* Existing Classes */}
      <div>
        <label>Or Select Existing Class:</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select Class</option>
          {classInfos.map(info => (
            <option key={info.id} value={info.className}>{info.className}</option>
          ))}
        </select>
      </div>

      {/* Add Section and Subject */}
      <form onSubmit={handleAddSectionAndSubject}>
        <div>
          <label>Section:</label>
          <select value={section} onChange={(e) => setSection(e.target.value)} required>
            <option value="">Select Section</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Subject:</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">Select Subject</option>
            {getSubjects(selectedClass || className).map((subj) => (
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

      {/* Existing Sections and Subjects */}
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Section</th>
            <th>Subject</th>
            <th>Academic Start</th>
            <th>Academic End</th>
            <th>Revision Start</th>
            <th>Revision End</th>
          </tr>
        </thead>
        <tbody>
          {classInfos.map((info) =>
            Object.keys(info.sections || {}).map((sec) =>
              (info.sections[sec].subjects || []).map(sub => (
                <tr key={`${info.className}-${sec}-${sub.subjectName}`}>
                  <td>{info.className}</td>
                  <td>{sec}</td>
                  <td>{sub.subjectName}</td>
                  <td>{new Date(sub.academicStartDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.academicEndDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.revisionStartDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.revisionEndDate).toLocaleDateString()}</td>
                </tr>
              ))
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClassInfo;
