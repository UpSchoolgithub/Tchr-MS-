import React from 'react';

const PeriodAssignmentForm = ({
  teachers,
  subjects,
  onAssign,
  selectedTeacher,
  setSelectedTeacher,
  selectedSubject,
  setSelectedSubject
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onAssign(selectedTeacher, selectedSubject);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Teacher:</label>
        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required>
          <option value="">Select a teacher</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Subject:</label>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} required>
          <option value="">Select a subject</option>
          {subjects.map(subject => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </div>
      <button type="submit">Assign</button>
    </form>
  );
};

export default PeriodAssignmentForm;
