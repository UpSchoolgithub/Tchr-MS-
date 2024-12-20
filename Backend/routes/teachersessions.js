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
    const sessions = await sequelize.query(
      `
      SELECT
          sessions.id AS sessionId,
              sp.id AS sessionPlanId, -- Ensure this column is fetched

          schools.name AS schoolName,
          classinfos.className AS className,
          sections.sectionName AS sectionName,
          subjects.subjectName AS subjectName,
          sessions.chapterName,
          sp.id AS sessionPlanId,
          sp.sessionNumber,
          topics.topicName AS topicName,
          concepts.concept AS mainConcept,
          concepts.conceptDetailing AS conceptDetailing,
          lessonplans.generatedLP AS lessonPlan,
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
          SessionPlans sp ON sp.sessionId = sessions.id
      LEFT JOIN
          Topics topics ON sp.id = topics.sessionPlanId
      LEFT JOIN
          Concepts concepts ON topics.id = concepts.topicId
      LEFT JOIN
          LessonPlans lessonplans ON concepts.id = lessonplans.conceptId
      JOIN
          schools ON timetable_entries.schoolId = schools.id
      JOIN
          classinfos ON timetable_entries.classId = classinfos.id
      JOIN
          sections ON timetable_entries.sectionId = sections.id
      WHERE
          timetable_entries.teacherId = :teacherId
          AND timetable_entries.sectionId = :sectionId
          AND timetable_entries.subjectId = :subjectId
          AND DATE_ADD(
              subjects.academicStartDate,
              INTERVAL ((sessions.priorityNumber - 1) * 7 + (sp.sessionNumber - 1)) DAY
          ) = CURDATE() -- Filter for today's sessions
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

    const sessionMap = new Map();

    sessions.forEach((session) => {
      if (!sessionMap.has(session.sessionId)) {
        sessionMap.set(session.sessionId, {
          sessionId: session.sessionId,
          schoolName: session.schoolName,
          className: session.className,
          sectionName: session.sectionName,
          subjectName: session.subjectName,
          chapterName: session.chapterName,
          sessionPlanId: session.sessionPlanId,
          sessionNumber: session.sessionNumber,
          topics: [],
          priorityNumber: session.priorityNumber,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
        });
      }

      const currentSession = sessionMap.get(session.sessionId);

      const topicIndex = currentSession.topics.findIndex((t) => t.name === session.topicName);

      if (topicIndex === -1) {
        currentSession.topics.push({
          name: session.topicName,
          details: [
            {
              concept: session.mainConcept,
              conceptDetailing: session.conceptDetailing,
              lessonPlans: session.lessonPlan ? [session.lessonPlan] : [],
            },
          ],
        });
      } else {
        const topic = currentSession.topics[topicIndex];
        const existingConcept = topic.details.find((d) => d.concept === session.mainConcept);

        if (!existingConcept) {
          topic.details.push({
            concept: session.mainConcept,
            conceptDetailing: session.conceptDetailing,
            lessonPlans: session.lessonPlan ? [session.lessonPlan] : [],
          });
        } else if (session.lessonPlan && !existingConcept.lessonPlans.includes(session.lessonPlan)) {
          existingConcept.lessonPlans.push(session.lessonPlan);
        }
      }
    });

    const formattedSessions = Array.from(sessionMap.values());

    res.status(200).json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});



// Fetch sessions and session plan details for start
router.get('/teachers/:teacherId/sections/:sectionId/subjects/:subjectId/sessions', async (req, res) => {
  const { teacherId, sectionId, subjectId } = req.params;

  try {
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
          topics.topicName AS topicName,
          concepts.concept AS mainConcept,
          concepts.conceptDetailing AS conceptDetailing,
          lessonplans.generatedLP AS lessonPlan,
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
          SessionPlans sp ON sp.sessionId = sessions.id
      LEFT JOIN
          Topics topics ON sp.id = topics.sessionPlanId
      LEFT JOIN
          Concepts concepts ON topics.id = concepts.topicId
      LEFT JOIN
          LessonPlans lessonplans ON concepts.id = lessonplans.conceptId
      JOIN
          schools ON timetable_entries.schoolId = schools.id
      JOIN
          classinfos ON timetable_entries.classId = classinfos.id
      JOIN
          sections ON timetable_entries.sectionId = sections.id
      WHERE
          timetable_entries.teacherId = :teacherId
          AND timetable_entries.sectionId = :sectionId
          AND timetable_entries.subjectId = :subjectId
          AND DATE_ADD(
              subjects.academicStartDate,
              INTERVAL ((sessions.priorityNumber - 1) * 7 + (sp.sessionNumber - 1)) DAY
          ) = CURDATE() -- Filter for today's sessions
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

    // Debugging: Log the raw sessions data
    console.log('Raw Sessions Response:', sessions);

    const sessionMap = new Map();

    sessions.forEach((session) => {
      if (!sessionMap.has(session.sessionId)) {
        sessionMap.set(session.sessionId, {
          sessionId: session.sessionId,
          schoolName: session.schoolName,
          className: session.className,
          sectionName: session.sectionName,
          subjectName: session.subjectName,
          chapterName: session.chapterName,
          sessionPlanId: session.sessionPlanId,
          sessionNumber: session.sessionNumber,
          topics: [],
          priorityNumber: session.priorityNumber,
          sessionDate: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
        });
      }

      const currentSession = sessionMap.get(session.sessionId);

      const topicIndex = currentSession.topics.findIndex((t) => t.name === session.topicName);

      if (topicIndex === -1) {
        currentSession.topics.push({
          name: session.topicName,
          details: [
            {
              concept: session.mainConcept,
              conceptDetailing: session.conceptDetailing,
              lessonPlans: session.lessonPlan ? [session.lessonPlan] : [],
            },
          ],
        });
      } else {
        const topic = currentSession.topics[topicIndex];
        const existingConcept = topic.details.find((d) => d.concept === session.mainConcept);

        if (!existingConcept) {
          topic.details.push({
            concept: session.mainConcept,
            conceptDetailing: session.conceptDetailing,
            lessonPlans: session.lessonPlan ? [session.lessonPlan] : [],
          });
        } else if (session.lessonPlan && !existingConcept.lessonPlans.includes(session.lessonPlan)) {
          existingConcept.lessonPlans.push(session.lessonPlan);
        }
      }
    });

    const formattedSessions = Array.from(sessionMap.values());

    // Debugging: Log the formatted sessions before sending the response
    console.log('Formatted Sessions Response:', formattedSessions);

    res.status(200).json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
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
  const { sessionId } = req.params;
  const { incompleteConcepts, completedConcepts } = req.body;

  try {
    // Fetch the current session
    const session = await Session.findByPk(sessionId, {
      include: [{ model: SessionPlan, as: 'SessionPlan' }],
    });

    if (!session || !session.SessionPlan) {
      return res.status(404).json({ error: 'Session or Session Plan not found.' });
    }

    // Save completed concepts
    await SessionReport.create({
      sessionPlanId: session.SessionPlan.id,
      completedConcepts: JSON.stringify(completedConcepts),
      incompleteConcepts: JSON.stringify(incompleteConcepts),
    });

    // Push incomplete concepts to the next session
    if (incompleteConcepts.length > 0) {
      const nextSession = await Session.findOne({
        where: { id: { [Op.gt]: sessionId }, sectionId: session.sectionId },
        include: [{ model: SessionPlan, as: 'SessionPlan' }],
      });

      if (nextSession && nextSession.SessionPlan) {
        // Update the next session plan
        await Concepts.bulkCreate(
          incompleteConcepts.map((concept) => ({
            topicId: nextSession.SessionPlan.id,
            concept: concept.name,
            conceptDetailing: concept.detailing,
          }))
        );
      }
    }

    res.json({ message: 'Session ended successfully!' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end the session.' });
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
