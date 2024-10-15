import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
  const navigate = useNavigate();
  const [classInfos, setClassInfos] = useState([]);
  const [className, setClassName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [academicStartDate, setAcademicStartDate] = useState('');
  const [academicEndDate, setAcademicEndDate] = useState('');
  const [revisionStartDate, setRevisionStartDate] = useState('');
  const [revisionEndDate, setRevisionEndDate] = useState('');
  const [error, setError] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [tempDates, setTempDates] = useState({});

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

  const handleClassSubmit = async () => {
    if (newClassName) {
      try {
        await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, { className: newClassName });
        setClassName(newClassName);
        setNewClassName('');
        await fetchClassInfos();
      } catch (error) {
        console.error('Error adding class:', error);
        setError('Failed to add class. Please try again.');
      }
    }
  };

  const getOrCreateSectionId = async (existingClassId, sectionName) => {
    const existingClass = classInfos.find(cls => cls.className === className);
    
    // Check if the section already exists in the selected class
    if (existingClass && existingClass.sections[sectionName]) {
      return existingClass.sections[sectionName].id;
    } else {
      // Create the section if it does not exist
      const sectionResponse = await axios.post(`https://tms.up.school/api/classes/${existingClassId}/sections`, {
        sections: { [sectionName]: { subjects: [] } },
        schoolId
      });
      return sectionResponse.data.sections[sectionName].id;
    }
  };

  const handleSectionSubjectSubmit = async (e) => {
    e.preventDefault();

    // Ensure dates are in correct order
    if (new Date(academicStartDate) >= new Date(academicEndDate) ||
        new Date(academicEndDate) >= new Date(revisionStartDate) ||
        new Date(revisionStartDate) >= new Date(revisionEndDate)) {
      alert('Please ensure dates are in the correct order.');
      return;
    }

    try {
      const existingClass = classInfos.find(cls => cls.className === className);
      if (!existingClass) {
        setError('Selected class not found.');
        return;
      }

      const sectionId = await getOrCreateSectionId(existingClass.id, section);

      const newSubject = {
        subjectName: subject,
        academicStartDate,
        academicEndDate,
        revisionStartDate,
        revisionEndDate,
      };

      await axios.post(`https://tms.up.school/api/classes/${existingClass.id}/sections`, {
        sections: {
          [section]: { subjects: [newSubject] }
        },
        schoolId
      });

      await fetchClassInfos();
      resetForm();
    } catch (error) {
      console.error('Error adding section or subject:', error);
      setError('Failed to add section or subject. Please try again.');
    }
  };

  const handleDelete = async (classId, sectionId, subjectId) => {
    try {
      await axios.delete(`https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}`);
      fetchClassInfos();
    } catch (error) {
      console.error('Error deleting subject:', error);
      setError('Failed to delete the subject. Please try again.');
    }
  };

  const manageSessions = (classId, section, subjectId) => {
    navigate(`/schools/${schoolId}/classes/${classId}/sections/${section}/subjects/${subjectId}/sessions`);
  };

  const handleEdit = (className, section, subject) => {
    setEditingSubject(`${className}-${section}-${subject.subjectName}`);
    setTempDates({
      academicStartDate: subject.academicStartDate,
      academicEndDate: subject.academicEndDate,
      revisionStartDate: subject.revisionStartDate,
      revisionEndDate: subject.revisionEndDate,
    });
  };

  const handleSave = async (classId, sectionId, subjectId) => {
    try {
      await axios.put(`https://tms.up.school/api/schools/${schoolId}/classes/${classId}/sections/${sectionId}/subjects/${subjectId}`, tempDates);
      setEditingSubject(null);
      fetchClassInfos();
    } catch (error) {
      console.error('Error saving subject:', error);
      setError('Failed to save the subject. Please try again.');
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
        <select value={className} onChange={(e) => setClassName(e.target.value)}>
          <option value="">Select Class</option>
          {[...new Set(classInfos.map((info) => info.className))].map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSectionSubjectSubmit}>
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
            <th>Actions</th>
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
                  <td>
                    {editingSubject === `${info.className}-${sec}-${sub.subjectName}` ? (
                      <input
                        type="date"
                        value={tempDates.academicStartDate}
                        onChange={(e) => setTempDates({ ...tempDates, academicStartDate: e.target.value })}
                      />
                    ) : (
                      new Date(sub.academicStartDate).toLocaleDateString()
                    )}
                  </td>
                  <td>
                    {editingSubject === `${info.className}-${sec}-${sub.subjectName}` ? (
                      <input
                        type="date"
                        value={tempDates.academicEndDate}
                        onChange={(e) => setTempDates({ ...tempDates, academicEndDate: e.target.value })}
                      />
                    ) : (
                      new Date(sub.academicEndDate).toLocaleDateString()
                    )}
                  </td>
                  <td>
                    {editingSubject === `${info.className}-${sec}-${sub.subjectName}` ? (
                      <input
                        type="date"
                        value={tempDates.revisionStartDate}
                        onChange={(e) => setTempDates({ ...tempDates, revisionStartDate: e.target.value })}
                      />
                    ) : (
                      new Date(sub.revisionStartDate).toLocaleDateString()
                    )}
                  </td>
                  <td>
                    {editingSubject === `${info.className}-${sec}-${sub.subjectName}` ? (
                      <input
                        type="date"
                        value={tempDates.revisionEndDate}
                        onChange={(e) => setTempDates({ ...tempDates, revisionEndDate: e.target.value })}
                      />
                    ) : (
                      new Date(sub.revisionEndDate).toLocaleDateString()
                    )}
                  </td>
                  <td>
                    {editingSubject === `${info.className}-${sec}-${sub.subjectName}` ? (
                      <button onClick={() => handleSave(info.id, sec, sub.id)}>Save</button>
                    ) : (
                      <button onClick={() => handleEdit(info.className, sec, sub)}>Edit</button>
                    )}
                    <button onClick={() => handleDelete(info.id, sec, sub.id)}>Delete</button>
                    <button onClick={() => manageSessions(info.id, sec, sub.id)}>Manage Sessions</button>
                  </td>
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
