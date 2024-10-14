import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [editing, setEditing] = useState(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [error, setError] = useState('');

  const classes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
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

  const handleAddClass = async () => {
    if (newClassName && !classInfos.some(info => info.className === newClassName)) {
      try {
        await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, {
          className: newClassName,
          sections: {}
        });
        
        fetchClassInfos();
        
        setNewClassName('');
        setClassName(newClassName);
        setIsAddingClass(false);
        
        alert(`Class ${newClassName} added successfully!`);
      } catch (error) {
        console.error('Error adding new class:', error);
        alert('Failed to add new class. Please try again.');
      }
    } else {
      alert('Class already exists or is invalid.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editing) {
      await handleEditSave();
      return;
    }

    const duplicate = classInfos.some(info =>
      info.className === className &&
      info.sections?.[section]?.subjects?.some(sub => sub.subjectName === subject)
    );

    if (duplicate) {
      alert('This class-section-subject combination already exists.');
      return;
    }

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
      await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, {
        className,
        sections: {
          [section]: { subjects: [newSubject] }
        }
      });

      fetchClassInfos();
      resetForm();
    } catch (error) {
      console.error('Error adding subject:', error);
      setError('Failed to add subject. Please try again.');
    }
  };

  const handleEditSave = async () => {
    try {
      const updatedSubject = {
        subjectName: editing.subjectName,
        academicStartDate: editing.academicStartDate,
        academicEndDate: editing.academicEndDate,
        revisionStartDate: editing.revisionStartDate,
        revisionEndDate: editing.revisionEndDate,
      };

      await axios.put(`https://tms.up.school/api/sections/${editing.section}/subjects/${editing.id}`, updatedSubject);
      fetchClassInfos();
      resetForm();
      setEditing(null);
    } catch (error) {
      console.error('Error updating subject:', error);
      setError('Failed to update subject. Please try again.');
    }
  };

  const handleEdit = (classInfo, sec, sub) => {
    setEditing({ ...sub, className: classInfo.className, section: sec });
  };

  const handleDelete = async (subjectId, section) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this subject?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://tms.up.school/api/subjects/${subjectId}`);
      fetchClassInfos();
    } catch (error) {
      console.error('Error deleting subject:', error);
      setError('Failed to delete subject. Please try again.');
    }
  };

  const handleSessionsClick = (classInfo, sec, sub) => {
    navigate(`/schools/${schoolId}/classes/${classInfo.className}/sections/${sec}/subjects/${sub.subjectName}/sessions`);
  };

  const resetForm = () => {
    setClassName('');
    setSection('');
    setSubject('');
    setAcademicStartDate('');
    setAcademicEndDate('');
    setRevisionStartDate('');
    setRevisionEndDate('');
    setEditing(null);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <div>
        {isAddingClass ? (
          <div>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter Class Name (1-10)"
            />
            <button onClick={handleAddClass}>Save Class</button>
            <button onClick={() => setIsAddingClass(false)}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setIsAddingClass(true)}>Add New Class</button>
        )}
        <label>Or Select Existing Class:</label>
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
        >
          <option value="">Select Class</option>
          {classInfos.map(info => (
            <option key={info.id} value={info.className}>{info.className}</option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Section:</label>
          <select value={section} onChange={(e) => setSection(e.target.value)} required>
            <option value="">Select Section</option>
            {sections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Subject:</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
            <option value="">Select Subject</option>
            {getSubjects(className).map(subj => (
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
        <button type="submit">{editing ? 'Save Changes' : 'Add Section and Subject'}</button>
      </form>
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
            <th>Sessions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classInfos.map(info => (
            Object.keys(info.sections || {}).map(sec => (
              (info.sections[sec].subjects || []).map(sub => (
                <tr key={`${info.className}-${sec}-${sub.subjectName}`}>
                  <td>{info.className}</td>
                  <td>{sec}</td>
                  <td>{sub.subjectName}</td>
                  <td>{new Date(sub.academicStartDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.academicEndDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.revisionStartDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.revisionEndDate).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleSessionsClick(info, sec, sub)}>Manage Sessions</button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(info, sec, sub)}>Edit</button>
                    <button onClick={() => handleDelete(sub.id, sec)}>Delete</button>
                  </td>
                </tr>
              ))
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassInfo;
