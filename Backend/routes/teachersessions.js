const express = require('express');
const router = express.Router();
const { Session, Teacher, School, ClassInfo, Section, Subject, Attendance, Student, SessionPlan } = require('../models'); // Import models as needed

// Get sessions for a specific teacher
router.get('/teachers/:teacherId/assignments', async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch sessions assigned to the teacher
    const sessions = await Session.findAll({
      where: { teacherId },
      include: [
        { model: School, attributes: ['id', 'name'] },
        { model: ClassInfo, attributes: ['id', 'className'] },
        { model: Subject, attributes: ['id', 'subjectName'] },
        { model: Section, attributes: ['id', 'sectionName'] },
        { model: SessionPlan, attributes: ['id'], as: 'SessionPlan' } // Include sessionPlanId
      ],
      attributes: ['id', 'day', 'period', 'startTime', 'endTime', 'assignments'],
    });
    

    // Format response with session details
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      schoolName: session.School ? session.School.name : 'N/A',
      className: session.ClassInfo ? session.ClassInfo.className : 'N/A',
      sectionName: session.Section ? session.Section.sectionName : 'N/A',
      subjectName: session.Subject ? session.Subject.subjectName : 'N/A',
      day: session.day,
      period: session.period,
      startTime: session.startTime,
      endTime: session.endTime,
      assignments: session.assignments,
      sessionPlanId: session.SessionPlan ? session.SessionPlan.id : null // Add sessionPlanId
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
  const { date, absentees, sectionId } = req.body;

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
    const allStudents = await Student.findAll({ where: { sectionId } });
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


// Get session details for a specific teacher and session
// Get session details for a specific teacher and session
router.get('/teachers/:teacherId/sessions/:sessionId', async (req, res) => {
  const { teacherId, sessionId } = req.params;

  try {
    // Fetch session with associations
    const session = await Session.findOne({
      where: { id: sessionId, teacherId },
      include: [
        { model: School, attributes: ['name'] },
        { model: ClassInfo, attributes: ['className'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName'] },
        { 
          model: SessionPlan, 
          attributes: ['id', 'sessionNumber', 'planDetails', 'completed'], 
          as: 'SessionPlan' 
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Prepare the response format
    res.json({
      sessionDetails: {
        id: session.id,
        schoolName: session.School ? session.School.name : 'N/A',
        className: session.ClassInfo ? session.ClassInfo.className : 'N/A',
        sectionName: session.Section ? session.Section.sectionName : 'N/A',
        subjectName: session.Subject ? session.Subject.subjectName : 'N/A',
        day: session.day,
        period: session.period,
        startTime: session.startTime,
        endTime: session.endTime,
        assignments: session.assignments || 'No assignments',
        sessionPlanId: session.SessionPlan ? session.SessionPlan.id : null // Add sessionPlanId here as well
      },
      sessionPlans: session.SessionPlan ? [{
        id: session.SessionPlan.id,
        sessionNumber: session.SessionPlan.sessionNumber,
        planDetails: JSON.parse(session.SessionPlan.planDetails), // Assuming planDetails is a JSON string
        completed: session.SessionPlan.completed,
      }] : []
    });
  } catch (error) {
    console.error('Error fetching session and session plans:', error);
    res.status(500).json({ error: 'Failed to fetch session details and plans' });
  }
});



// Fetch sessions and associated session plans for a specific teacher, section, and subject
router.get('/teachers/:teacherId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { teacherId, sectionId, subjectId } = req.params;
  const { day, date } = req.query;

  try {
    const whereClause = {
      teacherId,
      sectionId,
      subjectId,
    };

    if (day) whereClause.day = day;
    if (date) whereClause.date = date;

    const sessions = await Session.findAll({
      where: whereClause,
      include: [
        {
          model: SessionPlan,
          attributes: ['id', 'sessionNumber', 'planDetails', 'completed'], // Include session plan details
        },
      ],
      attributes: ['id', 'chapterName', 'numberOfSessions', 'priorityNumber', 'startTime', 'endTime'],
    });

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'No sessions found for the given filters' });
    }

    // Format response
    const formattedSessions = sessions.map((session) => ({
      sessionId: session.id,
      chapterName: session.chapterName,
      startTime: session.startTime,
      endTime: session.endTime,
      sessionPlan: session.SessionPlan
        ? {
            id: session.SessionPlan.id,
            sessionNumber: session.SessionPlan.sessionNumber,
            topicsCompleted: session.SessionPlan.completed,
            totalTopics: JSON.parse(session.SessionPlan.planDetails || '[]').length,
            planDetails: JSON.parse(session.SessionPlan.planDetails || '[]'),
          }
        : null,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions with session plans:', error);
    res.status(500).json({ error: 'Failed to fetch sessions and session plans' });
  }
});


router.get('/teachers/:teacherId/sections/:sectionId/subjects/:subjectId/sessions/start', async (req, res) => {
  const { teacherId, sectionId, subjectId } = req.params;

  try {
    // Fetch sessions based on teacherId, sectionId, and subjectId
    const sessions = await Session.findAll({
      where: { teacherId, sectionId, subjectId },
      include: [
        { model: SessionPlan, attributes: ['id', 'sessionNumber', 'planDetails'], as: 'SessionPlan' }, // Fetch associated session plans
        { model: ClassInfo, attributes: ['className'] }, // Optional, if you need className
        { model: Section, attributes: ['sectionName'] }, // Optional, if you need sectionName
        { model: Subject, attributes: ['subjectName'] } // Optional, if you need subjectName
      ],
      attributes: ['id', 'chapterName', 'numberOfSessions', 'priorityNumber', 'startTime', 'endTime'], // Session details
    });

    if (!sessions.length) {
      return res.status(404).json({ error: 'No sessions found for the specified criteria' });
    }

    // Prepare response with session and session plan details
    const sessionDetails = sessions.map((session) => ({
      sessionId: session.id,
      chapterName: session.chapterName,
      startTime: session.startTime,
      endTime: session.endTime,
      sessionPlanId: session.SessionPlan ? session.SessionPlan.id : null,
      sessionPlanDetails: session.SessionPlan ? session.SessionPlan.planDetails : null,
      subjectName: session.Subject ? session.Subject.subjectName : 'N/A',
      sectionName: session.Section ? session.Section.sectionName : 'N/A',
    }));

    res.json({ sessionDetails });
  } catch (error) {
    console.error('Error fetching session and session plan details:', error);
    res.status(500).json({ error: 'Failed to fetch session details and plans' });
  }
});

// Get students for a specific section
router.get('/teachers/:teacherId/sections/:sectionId/students', async (req, res) => {
  const { teacherId, sectionId } = req.params;

  try {
    // Validate sectionId
    if (!sectionId) {
      return res.status(400).json({ error: 'Section ID is required' });
    }

    // Validate if the section exists
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Fetch students for the given section
    const students = await Student.findAll({
      where: { sectionId },
      attributes: [
        'id',
        'rollNumber',
        'studentName',
        'studentEmail',
        'studentPhoneNumber',
        'parentName',
        'parentPhoneNumber1',
        'parentPhoneNumber2',
        'parentEmail',
      ],
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No students found for this section' });
    }

    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students for the section' });
  }
});

module.exports = router;
