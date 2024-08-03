import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassInfos = async () => {
      try {
        const response = await axios.get(`https://tms.up.school/api/schools/${schoolId}/classes`);
        setClassInfos(response.data);
      } catch (error) {
        console.error('Error fetching class sections:', error);
      }
    };

    fetchClassInfos();
  }, [schoolId]);

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    const existingClass = classInfos.find(info => info.className === className && info.subject === subject && info.section === 'A');
    if (!existingClass && section !== 'A') {
      alert('You must first add section A for this class and subject.');
      return;
    }
    if (existingClass) {
      try {
        const newSection = {
          className: className,
          section: section,
          subject: subject,
          academicStartDate: existingClass.academicStartDate,
          academicEndDate: existingClass.academicEndDate,
          revisionStartDate: existingClass.revisionStartDate,
          revisionEndDate: existingClass.revisionEndDate
        };
        const response = await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, newSection);
        setClassInfos([...classInfos, response.data]);
        resetForm();
      } catch (error) {
        console.error('Error adding new section:', error);
      }
    } else {
      setShowDetailsForm(true);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    try {
      const classDetails = {
        className,
        section,
        subject,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate
      };
      if (editingClass) {
        await axios.put(`https://tms.up.school/api/schools/${schoolId}/classes/${editingClass.id}`, classDetails);
        setClassInfos(classInfos.map(info => (info.id === editingClass.id ? { ...info, ...classDetails } : info)));
        setEditingClass(null);
      } else {
        const response = await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, classDetails);
        setClassInfos([...classInfos, response.data]);
      }
      setShowDetailsForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding/editing class section:', error);
    }
  };

  const resetForm = () => {
    setClassName('');
    setSection('');
    setSubject('');
    setAcademicStartDate('');
    setAcademicEndDate('');
    setRevisionStartDate('');
    setRevisionEndDate('');
  };

  const handleEdit = (classInfo) => {
    setEditingClass(classInfo);
    setAcademicStartDate(classInfo.academicStartDate);
    setAcademicEndDate(classInfo.academicEndDate);
    setRevisionStartDate(classInfo.revisionStartDate);
    setRevisionEndDate(classInfo.revisionEndDate);
  };

  const handleSave = async (classInfo) => {
    try {
      const updatedClassInfo = {
        ...classInfo,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate
      };
      await axios.put(`https://tms.up.school/api/schools/${schoolId}/classes/${classInfo.id}`, updatedClassInfo);
      setClassInfos(classInfos.map(info => (info.id === classInfo.id ? updatedClassInfo : info)));
      setEditingClass(null);
    } catch (error) {
      console.error('Error updating class section:', error);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this class?');
    if (!confirmDelete) return;
  
    try {
      await axios.delete(`https://tms.up.school/api/schools/${schoolId}/classes/${id}`);
      setClassInfos(classInfos.filter(info => info.id !== id));
    } catch (error) {
      console.error('Error deleting class section:', error);
      setError('Failed to delete class. Please try again.');
    }
  };
  

  const handleSessionsClick = (classInfo) => {
    navigate(`/schools/${schoolId}/classes/${classInfo.id}/sections/${classInfo.section}/sessions`);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleClassSubmit}>
        <div>
          <label>Class Name:</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Section Name:</label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <button type="submit">Next</button>
      </form>

      {showDetailsForm && (
        <form onSubmit={handleDetailsSubmit}>
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
          <button type="submit">Save</button>
        </form>
      )}

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
          {classInfos.map((info) => (
            <tr key={info.id}>
              <td>{info.className}</td>
              <td>{info.section}</td>
              <td>{info.subject}</td>
              <td>
                {editingClass && editingClass.id === info.id ? (
                  <input
                    type="date"
                    value={academicStartDate}
                    onChange={(e) => setAcademicStartDate(e.target.value)}
                  />
                ) : (
                  new Date(info.academicStartDate).toLocaleDateString()
                )}
              </td>
              <td>
                {editingClass && editingClass.id === info.id ? (
                  <input
                    type="date"
                    value={academicEndDate}
                    onChange={(e) => setAcademicEndDate(e.target.value)}
                  />
                ) : (
                  new Date(info.academicEndDate).toLocaleDateString()
                )}
              </td>
              <td>
                {editingClass && editingClass.id === info.id ? (
                  <input
                    type="date"
                    value={revisionStartDate}
                    onChange={(e) => setRevisionStartDate(e.target.value)}
                  />
                ) : (
                  new Date(info.revisionStartDate).toLocaleDateString()
                )}
              </td>
              <td>
                {editingClass && editingClass.id === info.id ? (
                  <input
                    type="date"
                    value={revisionEndDate}
                    onChange={(e) => setRevisionEndDate(e.target.value)}
                  />
                ) : (
                  new Date(info.revisionEndDate).toLocaleDateString()
                )}
              </td>
              <td>
                <button onClick={() => handleSessionsClick(info)}>Sessions</button>
              </td>
              <td>
                {editingClass && editingClass.id === info.id ? (
                  <button onClick={() => handleSave(info)}>Save</button>
                ) : (
                  <button onClick={() => handleEdit(info)}>Edit</button>
                )}
                <button onClick={() => handleDelete(info.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassInfo;
