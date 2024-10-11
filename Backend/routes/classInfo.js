const express = require('express');
const router = express.Router();
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// Get all class infos for a school, with sections grouped under each class
router.get('/schools/:schoolId/classes', async (req, res) => {
  try {
    const classInfos = await ClassInfo.findAll({
      where: { schoolId: req.params.schoolId },
      include: [{ model: Section }]
    });

    // Format data to group sections under each class
    const formattedClasses = classInfos.map(classInfo => {
      const sections = {};
      classInfo.Sections.forEach(section => {
        sections[section.sectionName] = {
          id: section.id,
          schoolId: section.schoolId,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt
        };
      });
      return {
        id: classInfo.id,
        className: classInfo.className,
        subject: classInfo.subject,
        schoolId: classInfo.schoolId,
        sections
      };
    });

    res.status(200).json(formattedClasses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class infos', error });
  }
});

// Check if class and subject already exist
router.get('/schools/:schoolId/classes/check', async (req, res) => {
  const { className, subject } = req.query;
  try {
    const classInfo = await ClassInfo.findOne({
      where: { schoolId: req.params.schoolId, className, subject },
      include: [{ model: Section }]
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

// Add a class info with sections
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, subject, sections } = req.body;

  try {
    const newClassInfo = await ClassInfo.create({
      className,
      subject,
      schoolId,
    });

    // Create sections for the class
    for (const sectionName in sections) {
      await Section.create({
        sectionName,
        classInfoId: newClassInfo.id,
        schoolId,
      });
    }

    res.status(201).json(newClassInfo);
  } catch (error) {
    console.error('Error adding class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update existing class info and its sections
router.put('/schools/:schoolId/classes/:id', async (req, res) => {
  const { className, subject, sections } = req.body;

  try {
    const classInfo = await ClassInfo.findByPk(req.params.id);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await classInfo.update({ className, subject });

    // Update sections: delete existing ones and add new
    await Section.destroy({ where: { classInfoId: classInfo.id } });

    for (const sectionName in sections) {
      await Section.create({
        sectionName,
        classInfoId: classInfo.id,
        schoolId: req.params.schoolId,
      });
    }

    res.status(200).json(classInfo);
  } catch (error) {
    console.error('Error updating class info:', error);
    res.status(500).json({ message: 'Error updating class info', error: error.message });
  }
});

// Delete class info and its sections
router.delete('/schools/:schoolId/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id, {
      include: [{ model: Section }]
    });

    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await Section.destroy({ where: { classInfoId: classInfo.id } });
    await classInfo.destroy();

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
