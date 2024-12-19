const express = require('express');
const router = express.Router();
const { TimetableEntry, Session, Teacher, School, ClassInfo, Section, Subject, Attendance, Student, SessionPlan } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path based on your folder structure

// Get sessions for a specific teacher
// Get sessions for a specific teacher
router.get('/teachers/:teacherId/assignments', async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch sessions indirectly linked to the teacher via timetable_entries
    const sessions = await Session.findAll({
      attributes: ['id', 'sessionId', 'chapterName', 'priorityNumber', 'startTime', 'endTime'], // Include sessionId
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
        sessionId: session.id, // Correctly map session.id to sessionId
        schoolName: school.name || 'N/A',
        className: classInfo.className || 'N/A',
        sectionName: section.sectionName || 'N/A',
        subjectName: subject.subjectName || 'N/A',
        chapterName: session.chapterName || 'N/A',
        priorityNumber: session.priorityNumber,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionPlanId: session.SessionPlan?.id || 'N/A', // Add sessionPlanId here
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
    // Run the query to fetch all sessions with concept and detailing
    const sessions = await sequelize.query(
      `
      SELECT
          sessions.id AS sessionId,
          schools.name AS schoolName,
          classinfos.className AS className,
          sections.sectionName AS sectionName,
          subjects.subjectName AS subjectName,
          sessions.chapterName,
          sp.id AS sessionPlanId,
          sp.sessionNumber,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[0].name')) AS topic1Name,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[0].concept')) AS topic1Concept,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[1].name')) AS topic2Name,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[1].concept')) AS topic2Concept,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[2].name')) AS topic3Name,
          JSON_UNQUOTE(JSON_EXTRACT(sp.planDetails, '$[2].concept')) AS topic3Concept,
          concepts.concept AS mainConcept,
          concepts.conceptDetailing AS conceptDetailing,
          sessions.priorityNumber,
          DATE_ADD(
              subjects.academicStartDate,
              INTERVAL ((sessions.priorityNumber - 1) * 7 + (sp.sessionNumber - 1)) DAY
          ) AS sessionDate,
          timetable_entries.startTime,
          timetable_entries.endTime
      FROM
          timetable_entries
      JOIN
          subjects ON timetable_entries.subjectId = subjects.id
      JOIN
          sessions ON (
              sessions.subjectId = timetable_entries.subjectId AND
              sessions.sectionId = timetable_entries.sectionId
          )
      JOIN
          `SessionPlans` sp ON sp.sessionId = sessions.id
      JOIN
          schools ON timetable_entries.schoolId = schools.id
      JOIN
          classinfos ON timetable_entries.classId = classinfos.id
      JOIN
          sections ON timetable_entries.sectionId = sections.id
      LEFT JOIN
          concepts ON sp.id = concepts.topicId -- Assuming SessionPlans and Concepts are linked via topicId
      WHERE
          timetable_entries.teacherId = :teacherId
          AND timetable_entries.sectionId = :sectionId
          AND timetable_entries.subjectId = :subjectId
      ORDER BY
          sessionDate ASC, startTime ASC, sessions.priorityNumber ASC, sp.sessionNumber ASC;
      `,
      {
        replacements: {
          teacherId,
          sectionId,
          subjectId,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Format the response
    const formattedSessions = sessions.map((session) => ({
      sessionId: session.sessionId,
      schoolName: session.schoolName,
      className: session.className,
      sectionName: session.sectionName,
      subjectName: session.subjectName,
      chapterName: session.chapterName,
      sessionPlanId: session.sessionPlanId,
      sessionNumber: session.sessionNumber,
      topics: [
        { name: session.topic1Name, concept: session.topic1Concept },
        { name: session.topic2Name, concept: session.topic2Concept },
        { name: session.topic3Name, concept: session.topic3Concept },
      ].filter((topic) => topic.name), // Filter out null or undefined topics
      mainConcept: session.mainConcept,
      conceptDetailing: session.conceptDetailing,
      priorityNumber: session.priorityNumber,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
    }));

    res.status(200).json({ sessions: formattedSessions });
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
      const academicStartDate = session.Subject?.academicStartDate || 'N/A';

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
        startTime: session.TimetableEntry?.startTime || 'N/A',
        endTime: session.TimetableEntry?.endTime || 'N/A',
        sessionPlanId: session.SessionPlan?.id || 'N/A', // Include SessionPlan ID
        sessionNumber: session.SessionPlan?.sessionNumber || 'N/A',
        planDetails: session.SessionPlan?.planDetails ? JSON.parse(session.SessionPlan.planDetails) : [],
        subjectName: session.Subject?.subjectName || 'N/A',
        sectionName: session.Section?.sectionName || 'N/A',
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

// Save session details
router.post('/teachers/:teacherId/sessions/:sessionId/end', async (req, res) => {
  const { teacherId, sessionId } = req.params;
  const { incompleteConcepts, completedConcepts, assignmentDetails, observations, absentees } = req.body;

  try {
    // Fetch current session and plan
    const session = await Session.findOne({
      where: { id: sessionId },
      include: [
        { model: SessionPlan, as: 'SessionPlan', attributes: ['id', 'planDetails'] },
        { model: Subject, attributes: ['id'] },
      ],
    });

    if (!session || !session.SessionPlan) {
      return res.status(404).json({ error: 'Session or session plan not found.' });
    }

    // Log session report
    await sequelize.models.SessionReports.create({
      sessionPlanId: session.SessionPlan.id,
      sessionId,
      date: new Date().toISOString().split('T')[0],
      day: new Date().toLocaleString('en-US', { weekday: 'long' }),
      teacherId,
      absentStudents: JSON.stringify(absentees || []),
      sessionsCompleted: JSON.stringify(completedConcepts || []),
      sessionsToComplete: JSON.stringify(incompleteConcepts || []),
      assignmentDetails: assignmentDetails || null,
      observationDetails: observations || '',
    });

    // Carry forward incomplete concepts to the next session
    if (incompleteConcepts && incompleteConcepts.length > 0) {
      const nextSession = await Session.findOne({
        where: {
          subjectId: session.Subject.id,
          sectionId: session.sectionId,
          id: { [Op.gt]: sessionId }, // Get the next session by ID
        },
        include: [{ model: SessionPlan, as: 'SessionPlan', attributes: ['id', 'planDetails'] }],
        order: [['id', 'ASC']],
      });

      if (nextSession && nextSession.SessionPlan) {
        const nextPlanDetails = JSON.parse(nextSession.SessionPlan.planDetails || '[]');
        const updatedPlanDetails = [...incompleteConcepts, ...nextPlanDetails];

        // Update next session plan
        await SessionPlan.update(
          { planDetails: JSON.stringify(updatedPlanDetails) },
          { where: { id: nextSession.SessionPlan.id } }
        );
      }
    }

    res.json({ message: 'Session ended, incomplete concepts carried forward to the next session.' });
  } catch (error) {
    console.error('Error ending session and carrying forward concepts:', error.message);
    res.status(500).json({ error: 'Failed to process session details.' });
  }
});








// Fetch session details by session ID
// Endpoint to fetch session report details
router.get('/sessions/:sessionId/details', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId || sessionId === 'undefined') {
    return res.status(400).json({ error: 'Invalid session ID provided.' });
  }

  try {
    const sessionReport = await sequelize.models.SessionReports.findOne({
      where: { sessionId },
    });

    if (!sessionReport) {
      return res.status(404).json({ error: 'Session report not found.' });
    }

    res.json({
      sessionReport: {
        sessionsCompleted: JSON.parse(sessionReport.sessionsCompleted || '[]'),
        sessionsToComplete: JSON.parse(sessionReport.sessionsToComplete || '[]'),
        absentStudents: JSON.parse(sessionReport.absentStudents || '[]'),
        assignmentDetails: sessionReport.assignmentDetails || null,
        observationDetails: sessionReport.observationDetails || null,
      },
    });
  } catch (error) {
    console.error('Error fetching session report:', error);
    res.status(500).json({ error: 'Failed to fetch session report.' });
  }
});



router.get('/reports/sessions', async (req, res) => {
  const { startDate, endDate, teacherId, className, sectionName } = req.query;

  try {
    const whereConditions = {};
    if (startDate && endDate) whereConditions.date = { [Op.between]: [startDate, endDate] };
    if (teacherId) whereConditions.teacherId = teacherId;
    if (className) whereConditions.className = className;
    if (sectionName) whereConditions.sectionName = sectionName;

    const reports = await sequelize.models.SessionReports.findAll({ where: whereConditions });

    res.json(
      reports.map((report) => ({
        sessionPlanId: report.sessionPlanId,
        sessionId: report.sessionId,
        teacherId: report.teacherId,
        teacherName: report.teacherName,
        className: report.className,
        sectionName: report.sectionName,
        subjectName: report.subjectName,
        schoolName: report.schoolName,
        absentStudents: JSON.parse(report.absentStudents || '[]'),
        sessionsToComplete: JSON.parse(report.sessionsToComplete || '[]'),
        sessionsCompleted: JSON.parse(report.sessionsCompleted || '[]'),
        assignmentDetails: report.assignmentDetails,
        observationDetails: report.observationDetails,
        date: report.date,
        day: report.day,
      }))
    );
  } catch (error) {
    console.error('Error fetching session reports:', error);
    res.status(500).json({ error: 'Failed to fetch session reports.' });
  }
});


module.exports = router;
