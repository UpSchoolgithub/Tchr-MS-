const express = require('express');
const router = express.Router();
const { TimetableEntry, Session, Teacher, School, ClassInfo, Section, Subject, Attendance, Student, SessionPlan } = require('../models');
const sequelize = require('../config/db'); // Adjust the path based on your folder structure

// Get sessions for a specific teacher
// Get sessions for a specific teacher
router.get('/teachers/:teacherId/assignments', async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch sessions indirectly linked to the teacher via timetable_entries
    const sessions = await Session.findAll({
      include: [
        {
          model: Subject,
          include: [
            {
              model: Section,
              include: [
                {
                  model: ClassInfo,
                  include: [
                    {
                      model: School,
                      include: [
                        {
                          model: Teacher,
                          where: { id: teacherId }, // Filter by teacherId
                          attributes: [] // Exclude teacher attributes from response
                        }
                      ],
                    }
                  ],
                }
              ]
            }
          ]
        },
        { model: SessionPlan, as: 'SessionPlan', attributes: ['id', 'sessionNumber', 'planDetails'] }
      ],
      attributes: [
        'id',  // Ensure session.id is included
        'chapterName',
        'priorityNumber',
        'startTime',
        'endTime',
      ],
    });
    

    // Format response with session details
    const formattedSessions = sessions.map((session) => {
      const subject = session.Subject || {};
      const section = subject.Section || {};
      const classInfo = section.ClassInfo || {};
      const school = classInfo.School || {};

      return {
        id: session.id,
        schoolName: school.name || 'N/A',
        className: classInfo.className || 'N/A',
        sectionName: section.sectionName || 'N/A',
        subjectName: subject.subjectName || 'N/A',
        chapterName: session.chapterName || 'N/A',
        priorityNumber: session.priorityNumber,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionNumber: session.SessionPlan ? session.SessionPlan.sessionNumber : 'N/A',
        planDetails: session.SessionPlan ? JSON.parse(session.SessionPlan.planDetails || '[]') : [],
      };
    });

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
    // Mark attendance as "Absent" for absentees
    for (const studentId of absentees) {
      await Attendance.upsert({
        studentId,
        sessionId,
        date,
        status: 'A',
      });
    }

    // Mark remaining students as "Present"
    const allStudents = await Student.findAll({ where: { sectionId } });
    const presentStudents = allStudents.filter((student) => !absentees.includes(student.id));

    for (const student of presentStudents) {
      await Attendance.upsert({
        studentId: student.id,
        sessionId,
        date,
        status: 'P',
      });
    }

    // Fetch session details for the academic day
    const session = await Session.findOne({
      where: { id: sessionId },
      include: [
        { model: SessionPlan, attributes: ['sessionNumber', 'planDetails'], as: 'SessionPlan' },
        { model: Subject, attributes: ['academicStartDate'] },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const academicStartDate = new Date(session.Subject.academicStartDate);
    const currentDate = new Date();
    const academicDay = Math.floor((currentDate - academicStartDate) / (1000 * 60 * 60 * 24)) + 1;

    res.json({
      message: 'Attendance marked successfully',
      sessionDetails: {
        id: session.id,
        chapterName: session.chapterName,
        sessionNumber: session.SessionPlan.sessionNumber,
        topics: JSON.parse(session.SessionPlan.planDetails || '[]'),
        academicDay,
      },
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
});



// Get session details for a specific teacher and session
// Get session details for a specific teacher and session, with academic day
// Get session details for a specific teacher and session, with academic day
router.get('/teachers/:teacherId/sessions/:sessionId', async (req, res) => {
  const { teacherId, sessionId } = req.params;

  try {
    if (!sessionId || sessionId === 'unknown') {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    // Fetch session with associations
    const session = await Session.findOne({
      where: { id: sessionId, teacherId },
      include: [
        { model: School, attributes: ['name', 'academicStartDate'] },
        { model: ClassInfo, attributes: ['className', 'academicStartDate'] },
        { model: Section, attributes: ['sectionName'] },
        { model: Subject, attributes: ['subjectName', 'academicStartDate', 'revisionStartDate'] },
        { model: SessionPlan, attributes: ['id', 'sessionNumber', 'planDetails'], as: 'SessionPlan' },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Determine the start date (from Subject or ClassInfo/School)
    const academicStartDate =
      session.Subject?.academicStartDate || session.ClassInfo?.academicStartDate || session.School?.academicStartDate;

    if (!academicStartDate) {
      return res.status(400).json({ error: 'Academic start date is missing' });
    }

    // Calculate the academic day
    const startDate = new Date(academicStartDate);
    const currentDate = new Date();
    const differenceInDays = Math.floor(
      (currentDate - startDate) / (1000 * 60 * 60 * 24)
    );
    const academicDay = differenceInDays + 1; // Add 1 for the current day

    // Return session details with academic day
    res.json({
      sessionDetails: {
        id: session.id,
        chapterName: session.chapterName || 'N/A',
        sessionNumber: session.SessionPlan ? session.SessionPlan.sessionNumber : 'N/A',
        planDetails: session.SessionPlan ? JSON.parse(session.SessionPlan.planDetails || '[]') : [],
        academicDay, // Include academic day in the response
        academicStartDate, // Include academicStartDate for transparency
        revisionStartDate: session.Subject?.revisionStartDate || 'N/A', // Include revision start date if available
      },
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});




// Fetch sessions and associated session plans for a specific teacher, section, and subject
router.get('/teachers/:teacherId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { teacherId, sectionId, subjectId } = req.params;

  try {
    // Fetch the academic start date
    const subject = await Subject.findOne({ where: { id: subjectId } });
    if (!subject || !subject.academicStartDate) {
      return res.status(400).json({ error: 'Academic start date not found for this subject.' });
    }

    const academicStartDate = new Date(subject.academicStartDate);
    const currentDate = new Date();
    const academicDay = Math.floor((currentDate - academicStartDate) / (1000 * 60 * 60 * 24)) + 1;

    if (academicDay <= 0) {
      return res.status(400).json({ error: 'Academic session has not started yet.' });
    }

    // Fetch all sessions for the subject
    const sessions = await Session.findAll({
      where: { subjectId, sectionId },
      include: [
        { model: SessionPlan, attributes: ['sessionNumber', 'planDetails'], as: 'SessionPlan' },
      ],
      order: [['priorityNumber', 'ASC']],
    });

    if (!sessions.length) {
      return res.status(404).json({ error: 'No sessions found for this subject and section.' });
    }

    // Determine the current chapter and session
    let sessionDayCount = 0;
    let currentChapter = null;
    let sessionNumber = null;

    for (let session of sessions) {
      sessionDayCount += session.numberOfSessions;
      if (academicDay <= sessionDayCount) {
        currentChapter = session;
        sessionNumber = academicDay - (sessionDayCount - session.numberOfSessions);
        break;
      }
    }

    if (!currentChapter) {
      return res.status(400).json({ error: 'All sessions have been completed.' });
    }

    // Extract topics for the current session
    const sessionPlan = currentChapter.SessionPlan.find(
      (plan) => plan.sessionNumber === sessionNumber
    );

    const topics = sessionPlan ? JSON.parse(sessionPlan.planDetails) : [];

    // Respond with the current session details
    res.json({
      chapterName: currentChapter.chapterName,
      sessionNumber,
      topics,
      academicDay,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});



router.get('/teachers/:teacherId/sections/:sectionId/subjects/:subjectId/sessions/start', async (req, res) => {
  const { teacherId, sectionId, subjectId } = req.params;

  try {
    // Fetch sessions based on teacherId, sectionId, and subjectId
    const sessions = await Session.findAll({
      include: [
        {
          model: SessionPlan,
          attributes: ['id', 'sessionNumber', 'planDetails'], // Fetch session plan details
          as: 'SessionPlan',
        },
        {
          model: TimetableEntry,
          as: 'TimetableEntry', // Use the alias defined in the association
          where: {
            teacherId,
            sectionId,
            subjectId,
          },
          attributes: ['startTime', 'endTime'], // Fetch timetable details
          required: true,
        },
        { model: Subject, attributes: ['subjectName', 'academicStartDate'] }, // Fetch subject details
        { model: Section, attributes: ['sectionName'] }, // Fetch section details
        { model: School, attributes: ['name'] }, // Fetch school details
        { model: ClassInfo, attributes: ['className'] }, // Fetch class details
      ],
      attributes: ['id', 'chapterName', 'numberOfSessions', 'priorityNumber'], // Fetch session details
    });
    

    if (!sessions.length) {
      return res.status(404).json({ error: 'No sessions found for the specified criteria' });
    }

    // Prepare response with session and session plan details
    const sessionDetails = sessions.map((session) => {
      const academicStartDate = session.ClassInfo.academicStartDate;

      // Calculate academic day
      const startDate = new Date(academicStartDate);
      const currentDate = new Date();
      const differenceInDays = Math.floor(
        (currentDate - startDate) / (1000 * 60 * 60 * 24)
      );
      const academicDay = differenceInDays + 1;

      return {
        sessionId: session.id,
        chapterName: session.chapterName,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionPlanId: session.SessionPlan ? session.SessionPlan.id : null,
        sessionPlanDetails: session.SessionPlan ? session.SessionPlan.planDetails : null,
        subjectName: session.Subject ? session.Subject.subjectName : 'N/A',
        sectionName: session.Section ? session.Section.sectionName : 'N/A',
        academicDay, // Include academic day
      };
    });

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


// Fetch Academic Start Date from ClassInfo table
// Fetch academic start date from the subjects table
router.get('/classes/:classId/academic-start-date', async (req, res) => {
  const { classId } = req.params;

  try {
    const subjects = await Subject.findAll({
      where: { classInfoId: classId },
      attributes: ['academicStartDate'],
    });

    if (subjects.length === 0) {
      return res.status(404).json({ error: 'No subjects found for the class' });
    }

    // Assuming academicStartDate should be the same for all subjects
    res.json({ academicStartDate: subjects[0].academicStartDate });
  } catch (error) {
    console.error('Error fetching academic start date:', error);
    res.status(500).json({ error: 'Failed to fetch academic start date' });
  }
});




// Handle Incomplete Topics
router.post('/teachers/:teacherId/sessions/:sessionId/end', async (req, res) => {
  const { teacherId, sessionId } = req.params;
  const { incompleteTopics } = req.body;

  try {
    // Save incomplete topics to the next session
    const sessionPlan = await SessionPlan.findOne({ where: { sessionId } });
    if (!sessionPlan) return res.status(404).json({ error: 'Session Plan not found' });

    // Append incomplete topics to the next session's plan
    const nextSession = await SessionPlan.findOne({
      where: { sessionNumber: sessionPlan.sessionNumber + 1 },
    });

    if (nextSession) {
      nextSession.planDetails = [
        ...incompleteTopics,
        ...JSON.parse(nextSession.planDetails || '[]'),
      ];
      await nextSession.save();
    }

    res.json({ message: 'Session ended and topics rolled over.' });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});


// Find session ID based on school, class, section, and subject
router.get('/teachers/:teacherId/sessions/find', async (req, res) => {
  const { teacherId } = req.params;
  const { schoolId, classId, sectionId, subjectId } = req.query;

  try {
    const session = await Session.findOne({
      where: {
        teacherId,
        schoolId,
        classInfoId: classId,
        sectionId,
        subjectId,
      },
      attributes: ['id'], // Only fetch session ID
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found for the specified criteria' });
    }

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error finding session:', error);
    res.status(500).json({ error: 'Failed to fetch session ID' });
  }
});

module.exports = router;
