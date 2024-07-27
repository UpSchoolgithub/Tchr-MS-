const express = require('express');
const router = express.Router();
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// Get all class infos for a school
router.get('/schools/:schoolId/classes', async (req, res) => {
  try {
    const classInfos = await ClassInfo.findAll({ where: { schoolId: req.params.schoolId } });
    res.status(200).json(classInfos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class infos', error });
  }
});

// Check if class and subject already exist
router.get('/schools/:schoolId/classes/check', async (req, res) => {
  const { className, section, subject } = req.query;
  try {
    const classInfo = await ClassInfo.findOne({
      where: { schoolId: req.params.schoolId, className, section, subject }
    });
    if (classInfo) {
      res.status(200).json({ exists: true, classInfo });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking class and subject', error });
  }
});

// Add a class info
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, section, subject, academicStartDate, academicEndDate, revisionStartDate, revisionEndDate } = req.body;

  try {
    const newClassInfo = await ClassInfo.create({
      className,
      section,
      subject,
      academicStartDate,
      academicEndDate,
      revisionStartDate,
      revisionEndDate,
      schoolId,
    });

    // Create a section
    const newSection = await Section.create({
      sectionName: section,
      classInfoId: newClassInfo.id,
      schoolId,
    });

    // Create a subject
    await Subject.create({
      subjectName: subject,
      classInfoId: newClassInfo.id,
      sectionId: newSection.id,
      schoolId,
    });

    res.status(201).json(newClassInfo);
  } catch (error) {
    console.error('Error adding class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update existing class info with section and subject
router.put('/schools/:schoolId/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }
    await classInfo.update({
      className: req.body.className,
      section: req.body.section,
      subject: req.body.subject,
      academicStartDate: req.body.academicStartDate,
      academicEndDate: req.body.academicEndDate,
      revisionStartDate: req.body.revisionStartDate,
      revisionEndDate: req.body.revisionEndDate
    });

    if (req.body.section) {
      let section = await Section.findOne({ where: { sectionName: req.body.section, classInfoId: classInfo.id } });
      if (!section) {
        section = await Section.create({
          sectionName: req.body.section,
          classInfoId: classInfo.id,
          schoolId: req.params.schoolId
        });
      }
    }

    if (req.body.subject) {
      let section = await Section.findOne({ where: { sectionName: req.body.section, classInfoId: classInfo.id } });
      let subject = await Subject.findOne({ where: { subjectName: req.body.subject, classInfoId: classInfo.id, sectionId: section.id } });
      if (!subject) {
        await Subject.create({
          subjectName: req.body.subject,
          classInfoId: classInfo.id,
          sectionId: section.id,
          schoolId: req.params.schoolId
        });
      }
    }

    res.status(200).json(classInfo);
  } catch (error) {
    console.error('Error updating class info:', error.stack);
    res.status(500).json({ message: 'Error updating class info', error: error.message });
  }
});

// Delete class info with cascade deletion for sections and subjects
router.delete('/schools/:schoolId/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id, {
      include: [{ model: Section, include: [Subject] }]
    });

    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Logging for debugging
    console.log('Class info found:', classInfo);

    // Delete related subjects and sections
    for (const section of classInfo.Sections) {
      console.log('Deleting subjects for section:', section.id);
      await Subject.destroy({ where: { sectionId: section.id } });
      console.log('Deleting section:', section.id);
      await Section.destroy({ where: { id: section.id } });
    }

    console.log('Deleting class info:', req.params.id);
    await classInfo.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});




module.exports = router;
