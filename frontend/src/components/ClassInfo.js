import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';

const ClassInfo = () => {
  const { schoolId } = useOutletContext();
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
      const filteredClasses = response.data.filter((cls) => cls.board === selectedBoard);
      console.log('Filtered Class Infos:', filteredClasses); // Debugging
      setClassInfos(filteredClasses);
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError('Error fetching class data');
    }
  };
  

  const fetchSections = async (classId) => {
    try {
      const response = await axios.get(`https://tms.up.school/api/classes/${classId}/sections`);
      const updatedSections = response.data.map((section) => ({
        id: section.id,
        sectionName: section.sectionName,
      }));
      console.log('Fetched Sections:', updatedSections); // Debugging
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
      const payload = {
        className: newClassName,
        board: selectedBoard, // Include selected board
      };
      console.log('Submitting Class:', payload); // Debugging
  
      await axios.post(`https://tms.up.school/api/schools/${schoolId}/classes`, payload);
      setNewClassName('');
      setSelectedBoard(''); // Reset board selection
      fetchClassInfos();
    } catch (error) {
      console.error('Error adding class:', error);
      setError('Failed to add class. Please try again.');
    }
  };
  

  const handleSectionSubmit = async () => {
    const selectedClass = classInfos.find((cls) => cls.className === className);
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
    const selectedClass = classInfos.find(
      (cls) => cls.className === selectedClassName && cls.board === selectedBoard
    );
    if (selectedClass) {
      fetchSections(selectedClass.id);
    } else {
      setSections([]);
    }
  };
  

  const handleSectionSubjectSubmit = async (e) => {
    e.preventDefault();

    if (
      new Date(academicStartDate) >= new Date(academicEndDate) ||
      new Date(academicEndDate) >= new Date(revisionStartDate) ||
      new Date(revisionStartDate) >= new Date(revisionEndDate)
    ) {
      alert('Please ensure dates are in the correct order.');
      return;
    }

    try {
      const selectedClass = classInfos.find((cls) => cls.className === className);
      const selectedSection = sections.find((sec) => sec.sectionName === section);

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
        sections: { [section.toUpperCase()]: { subjects: [newSubject] } },
        schoolId,
      });

      fetchClassInfos();
      resetForm();
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

  return (
    <div>
      {error && <div className="error">{error}</div>}
  
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
          {classInfos
            .filter((cls) => cls.board === selectedBoard)
            .map((info) => (
              <option key={info.id} value={info.className}>
                {info.className}
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
              <option key={sec.id} value={sec.sectionName}>
                {sec.sectionName}
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
            {classInfos.map((info) =>
              Object.keys(info.sections || {}).map((sec) =>
                info.sections[sec].subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>{info.className}</td>
                    <td>{info.board}</td>
                    <td>{sec}</td>
                    <td>{subject.subjectName}</td>
                    <td>
                      {editingSubject === subject.id ? (
                        <input
                          type="date"
                          value={tempDates.academicStartDate}
                          onChange={(e) =>
                            setTempDates({
                              ...tempDates,
                              academicStartDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        new Date(subject.academicStartDate).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      {editingSubject === subject.id ? (
                        <input
                          type="date"
                          value={tempDates.academicEndDate}
                          onChange={(e) =>
                            setTempDates({
                              ...tempDates,
                              academicEndDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        new Date(subject.academicEndDate).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      {editingSubject === subject.id ? (
                        <input
                          type="date"
                          value={tempDates.revisionStartDate}
                          onChange={(e) =>
                            setTempDates({
                              ...tempDates,
                              revisionStartDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        new Date(subject.revisionStartDate).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      {editingSubject === subject.id ? (
                        <input
                          type="date"
                          value={tempDates.revisionEndDate}
                          onChange={(e) =>
                            setTempDates({
                              ...tempDates,
                              revisionEndDate: e.target.value,
                            })
                          }
                        />
                      ) : (
                        new Date(subject.revisionEndDate).toLocaleDateString()
                      )}
                    </td>
                    <td>
                      {editingSubject === subject.id ? (
                        <button onClick={() => handleSaveClick(info.id, sec, subject.id)}>
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleEditClick(
                              subject.id,
                              subject.academicStartDate,
                              subject.academicEndDate,
                              subject.revisionStartDate,
                              subject.revisionEndDate
                            )
                          }
                        >
                          Edit
                        </button>
                      )}
                      <button onClick={() => handleDeleteClick(info.id, sec, subject.id)}>
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          const selectedClass = info;
                          const sectionData = info.sections[sec];
  
                          if (sectionData && sectionData.id) {
                            navigate(
                              `/schools/${schoolId}/classes/${selectedClass.id}/sections/${sectionData.id}/subjects/${subject.id}/sessions`
                            );
                          } else {
                            console.error('Section ID not found for section name:', sec);
                            setError(`Section ID not found for section name: ${sec}`);
                          }
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
