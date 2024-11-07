// routes/teacherPortalRoutes.js
const express = require('express');
const router = express.Router();
const authenticateTeacherToken = require('../middleware/authenticateTeacherToken');
const { TimetableEntry, ClassInfo, Section, Subject, School } = require('../models');

// Route to fetch sessions for a specific teacher based on the day
router.get('/:teacherId/sessions', authenticateTeacherToken, async (req, res) => {
  const { teacherId } = req.params;
  const { day } = req.query; // Expect the day (e.g., 'Monday', 'Tuesday') as a query parameter

  try {
    // Query to fetch timetable sessions for the specific teacher on the specified day
    const sessions = await TimetableEntry.findAll({
      where: { teacherId, day },
      include: [
        { model: ClassInfo, attributes: ['name'] },
        { model: Section, attributes: ['name'] },
        { model: Subject, attributes: ['name'] },
        { model: School, attributes: ['name'] },
      ],
      order: [['startTime', 'ASC']],
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      className: session.ClassInfo ? session.ClassInfo.name : '',
      section: session.Section ? session.Section.name : '',
      subject: session.Subject ? session.Subject.name : '',
      duration: `${session.startTime} - ${session.endTime}`,
      schoolName: session.School ? session.School.name : '',
      sessionStarted: session.sessionStarted,
      sessionEnded: session.sessionEnded,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
