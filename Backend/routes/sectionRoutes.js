const express = require('express');
const router = express.Router();
const { Section, Subject, Session, SessionPlan } = require('../models'); // Ensure the path is correct

// Route to get all sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await Section.findAll();
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to add a new section by replicating an existing section's details
router.post('/schools/:schoolId/classes/:classId/sections', async (req, res) => {
  const { schoolId, classId } = req.params;
  const { name, replicateFromSectionId } = req.body;

  try {
    // Create the new section
    const newSection = await Section.create({ classId, name });

    // If replicateFromSectionId is provided, replicate the details
    if (replicateFromSectionId) {
      // Replicate subjects
      const subjects = await Subject.findAll({ where: { sectionId: replicateFromSectionId } });
      for (const subject of subjects) {
        await Subject.create({
          sectionId: newSection.id,
          name: subject.name,
        });
      }

      // Replicate sessions
      const sessions = await Session.findAll({ where: { sectionId: replicateFromSectionId } });
      for (const session of sessions) {
        const newSession = await Session.create({
          classId: classId,
          sectionId: newSection.id,
          chapterName: session.chapterName,
          numberOfSessions: session.numberOfSessions,
          priorityNumber: session.priorityNumber,
          lessonPlan: session.lessonPlan,
        });

        // Replicate session plans
        const sessionPlans = await SessionPlan.findAll({ where: { sessionId: session.id } });
        for (const plan of sessionPlans) {
          await SessionPlan.create({
            sessionId: newSession.id,
            planDetails: plan.planDetails,
            sessionNumber: plan.sessionNumber,
          });
        }
      }
    }

    res.status(201).json(newSection);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
