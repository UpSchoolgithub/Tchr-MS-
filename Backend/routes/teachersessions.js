const express = require('express');
const router = express.Router();
const { TimetableEntry, Session, Teacher, School, ClassInfo, Section, Subject, Attendance, Student, SessionPlan } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path based on your folder structure
const { Concept } = require('../models'); // Adjust the path if needed

// Get sessions for a specific teacher
// Get sessions for a specific teacher
router.get('/teachers/:teacherId/assignments', async (req, res) => {
  const { teacherId } = req.params;

  try {
    // Fetch sessions indirectly linked to the teacher via timetable_entries
    const sessions = await Session.findAll({
      attributes: ['id', 'chapterName', 'priorityNumber', 'startTime'], // Exclude 'endTime' from Session
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
              ],
            }
          ],
        },
        {
          model: SessionPlan,
          as: 'SessionPlan',
          attributes: ['id', 'sessionNumber', 'planDetails', 'sessionEndTime'], // Include sessionEndTime
        },
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
router.post('/teachers/:teacherId/sessions/:sessionId/add-topics', async (req, res) => {
  const { sessionId } = req.params;
  const { incompleteTopics } = req.body;

  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updatedTopics = [
      ...session.topics, // Existing topics
      ...incompleteTopics, // Add incomplete topics
    ];

    session.topics = updatedTopics;
    await session.save();

    res.status(200).json({ message: 'Topics added to the session successfully!' });
  } catch (error) {
    console.error('Error adding topics:', error);
    res.status(500).json({ error: 'Failed to add topics to the session.' });
  }
});


// Update session, topics, concepts, and unit/chapter status
const updateCompletionStatus = async (sessionId) => {
  try {
    // Fetch all topics linked to the session plan
    const topics = await sequelize.models.Topic.findAll({
      where: { sessionPlanId: sessionId },
      include: [
        {
          model: sequelize.models.Concept,
          as: 'Concepts',
        },
      ],
    });

    let allTopicsCompleted = true;

    for (const topic of topics) {
      const allConceptsCompleted = topic.Concepts.every((concept) => concept.completed);

      // Mark topic as complete if all concepts are completed
      if (allConceptsCompleted && !topic.completed) {
        await topic.update({ completed: true });
      } else if (!allConceptsCompleted) {
        allTopicsCompleted = false;
      }
    }

    // Mark session plan as complete if all topics are completed
    if (allTopicsCompleted) {
      await sequelize.models.SessionPlan.update(
        { completed: true },
        { where: { id: sessionId } }
      );

      // Fetch the session associated with this session plan
      const session = await sequelize.models.Session.findOne({
        where: { id: sessionId },
      });

      if (session) {
        // Check if all sessions for the chapter are completed
        const allSessionsInChapter = await sequelize.models.Session.findAll({
          where: { chapterName: session.chapterName },
        });

        const allSessionsCompleted = allSessionsInChapter.every(
          (s) => s.SessionPlan?.completed
        );

        if (allSessionsCompleted) {
          // Mark chapter as completed
          await sequelize.models.Session.update(
            { chapterCompleted: true },
            { where: { chapterName: session.chapterName } }
          );

          // Check if all chapters in the unit are completed
          const allChaptersInUnit = await sequelize.models.Session.findAll({
            where: { unitName: session.unitName },
          });

          const allChaptersCompleted = allChaptersInUnit.every(
            (chapter) => chapter.chapterCompleted
          );

          if (allChaptersCompleted) {
            // Mark unit as completed
            await sequelize.models.Session.update(
              { unitCompleted: true },
              { where: { unitName: session.unitName } }
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating completion status:', error);
    throw new Error('Failed to update completion status.');
  }
};



// Add this logic to the End Session API
router.post('/teachers/:teacherId/sessions/:sessionId/end', async (req, res) => {
  const { teacherId, sessionId } = req.params;
  const { completedConcepts = [], incompleteConcepts = [] } = req.body;

  const transaction = await sequelize.transaction();
  try {
    console.log('Request received:', { teacherId, sessionId, completedConcepts, incompleteConcepts });

    // Fetch session and session plan
    const session = await Session.findByPk(sessionId, {
      include: [{ model: SessionPlan, as: 'SessionPlan' }],
    });
    
    if (!session) {
      console.error(`Session not found for ID: ${sessionId}`);
      return res.status(404).json({ error: `Session not found for ID: ${sessionId}` });
    }
    
    if (!session.SessionPlan) {
      console.error(`SessionPlan not found for Session ID: ${sessionId}`);
      return res.status(404).json({ error: `SessionPlan not found for Session ID: ${sessionId}` });
    }
    

    console.log('Session and SessionPlan fetched:', { sessionId, sessionPlanId: sessionPlan.id });

    // Update completed concepts
    for (const concept of completedConcepts) {
      const conceptInstance = await Concept.findOne({ where: { name: concept.name } });
      if (!conceptInstance) {
        console.error(`Concept not found:`, concept.name);
        throw new Error(`Concept not found for name: ${concept.name}`);
      }

      await conceptInstance.update({ status: 'completed' }, { transaction });
      console.log(`Concept marked as completed:`, concept.name);
    }

    // Update incomplete concepts
    for (const concept of incompleteConcepts) {
      const conceptInstance = await Concept.findOne({ where: { name: concept.name } });
      if (!conceptInstance) {
        console.error(`Concept not found:`, concept.name);
        throw new Error(`Concept not found for name: ${concept.name}`);
      }

      await conceptInstance.update({ status: 'pending' }, { transaction });
      console.log(`Concept marked as pending:`, concept.name);
    }

    console.log('Concept updates completed.');

    // Commit transaction
    await transaction.commit();
    res.json({ message: 'Session ended successfully!' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error ending session:', error);
    res.status(500).json({ error: error.message || 'Failed to end the session.' });
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
