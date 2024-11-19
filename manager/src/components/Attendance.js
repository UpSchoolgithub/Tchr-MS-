import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import './Attendance.css'; // Ensure the CSS file contains styles for circular indicators

const Attendance = ({ schoolId, classId, sectionId }) => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth, currentYear]);

  const fetchAttendance = async () => {
    try {
      const response = await axiosInstance.get(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { params: { month: currentMonth, year: currentYear } }
      );

      const { students: fetchedStudents, attendanceRecords } = response.data;

      const formattedStudents = fetchedStudents.map((student) => ({
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.studentName,
      }));
      setStudents(formattedStudents);

      const attendanceData = {};
      attendanceRecords.forEach((record) => {
        const date = record.date;
        const studentId = record.studentId;
        if (!attendanceData[studentId]) attendanceData[studentId] = {};
        attendanceData[studentId][date] = record.status;
      });
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleStatusChange = (studentId, date) => {
    const currentStatus = attendance[studentId]?.[date] || 'P';
    const newStatus = currentStatus === 'P' ? 'A' : 'P';

    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [date]: newStatus,
      },
    }));
  };

  const handleSave = async () => {
    const attendanceData = [];
    for (const studentId in attendance) {
      for (const date in attendance[studentId]) {
        attendanceData.push({
          studentId,
          date,
          status: attendance[studentId][date],
        });
      }
    }

    try {
      await axiosInstance.post(
        `/schools/${schoolId}/classes/${classId}/sections/${sectionId}/attendance`,
        { attendanceData }
      );
      alert('Attendance updated successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance');
    }
  };

  const renderDates = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  return (
    <div className="attendance-management">
      <h3>Attendance for {`${currentMonth}/${currentYear}`}</h3>

      <div className="attendance-controls">
        <label>
          Month:
          <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}>
            {[...Array(12)].map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(0, index).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}>
            {[...Array(5)].map((_, index) => {
              const year = new Date().getFullYear() - 2 + index;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <table className="attendance-table">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Name</th>
            {renderDates().map((date) => (
              <th key={date}>{date}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              {renderDates().map((date) => {
                const fullDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(
                  2,
                  '0'
                )}`;
                const status = attendance[student.id]?.[fullDate] || '-';

                return (
                  <td
                    key={date}
                    onClick={() => handleStatusChange(student.id, fullDate)}
                    className={`attendance-cell ${
                      status === 'A' ? 'absent' : status === 'P' ? 'present' : ''
                    }`}
                  >
                    {status}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSave} className="save-button">Save Attendance</button>
    </div>
  );
};

export default Attendance;
