const express = require('express');
const router = express.Router();
const { Session, Teacher, School, ClassInfo, Section, Subject, Attendance, Student } = require('../models'); // Import models as needed

// Get sessions for a specific teacher
router.get('/teachers/:teacherId/assignments', async (req, res) => {
  const { teacherId } = req.params;
  
  try {
    // Fetch sessions assigned to the teacher
    const sessions = await Session.findAll({
      where: { teacherId },
      include: [
        {
          model: School,
          attributes: ['name'],
        },
        {
          model: ClassInfo,
          attributes: ['className'],
        },
        {
          model: Section,
          attributes: ['sectionName'],
        },
        {
          model: Subject,
          attributes: ['subjectName'],
        },
      ],
      attributes: ['id', 'day', 'period', 'startTime', 'endTime', 'assignments'],
    });

    // Format response with session details
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      schoolName: session.School.name,
      className: session.ClassInfo.className,
      sectionName: session.Section.sectionName,
      subjectName: session.Subject.subjectName,
      day: session.day,
      period: session.period,
      startTime: session.startTime,
      endTime: session.endTime,
      assignments: session.assignments,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Mark attendance for a session
router.post('/teachers/:teacherId/sessions/:sessionId/attendance', async (req, res) => {
  const { teacherId, sessionId } = req.params;
  const { date, absentees } = req.body;

  try {
    // Mark attendance as "Absent" for students listed in absentees
    for (const studentId of absentees) {
      await Attendance.upsert({
        studentId,
        sessionId,
        date,
        status: 'A',
      });
    }

    // Automatically mark others as "Present"
    const allStudents = await Student.findAll({ where: { sectionId: req.body.sectionId } });
    const presentStudents = allStudents.filter(student => !absentees.includes(student.id));

    for (const student of presentStudents) {
      await Attendance.upsert({
        studentId: student.id,
        sessionId,
        date,
        status: 'P',
      });
    }

    res.json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Fetch session details
router.get('/teachers/:teacherId/sessions/:sessionId', async (req, res) => {
  const { teacherId, sessionId } = req.params;

  try {
    const session = await Session.findOne({
      where: { id: sessionId, teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName'] },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionNumber: session.id,
      chapter: session.chapter || 'N/A',
      topicsToCover: session.topics || [],
      assignments: session.assignments,
      observations: session.observations,
      schoolName: session.School.name,
      className: session.ClassInfo.className,
      sectionName: session.Section.sectionName,
      subjectName: session.Subject.subjectName,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

module.exports = router;
