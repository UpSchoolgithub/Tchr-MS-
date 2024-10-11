const express = require('express');
const router = express.Router();
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// Get all class infos for a school, with sections and subjects grouped under each class
router.get('/schools/:schoolId/classes', async (req, res) => {
  try {
    const classInfos = await ClassInfo.findAll({
      where: { schoolId: req.params.schoolId },
      include: [{ 
        model: Section,
        include: [Subject] // Include subjects within each section
      }]
    });

    // Format data to group sections under each class, with nested subjects
    const formattedClasses = classInfos.map(classInfo => {
      const sections = {};
      classInfo.Sections.forEach(section => {
        sections[section.sectionName] = {
          id: section.id,
          schoolId: section.schoolId,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          subjects: section.Subjects.map(subject => ({
            id: subject.id,
            subjectName: subject.subjectName,
            academicStartDate: subject.academicStartDate,
            academicEndDate: subject.academicEndDate,
            revisionStartDate: subject.revisionStartDate,
            revisionEndDate: subject.revisionEndDate,
          }))
        };
      });
      return {
        id: classInfo.id,
        className: classInfo.className,
        schoolId: classInfo.schoolId,
        sections
      };
    });

    res.status(200).json(formattedClasses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class infos', error });
  }
});

// Add a class info with sections and subjects
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, sections } = req.body;

  try {
    const newClassInfo = await ClassInfo.create({
      className,
      schoolId,
    });

    for (const sectionName in sections) {
      const newSection = await Section.create({
        sectionName,
        classInfoId: newClassInfo.id,
        schoolId,
      });

      // Create subjects for the section
      const subjects = sections[sectionName].subjects || [];
      for (const subject of subjects) {
        await Subject.create({
          subjectName: subject.subjectName,
          academicStartDate: subject.academicStartDate,
          academicEndDate: subject.academicEndDate,
          revisionStartDate: subject.revisionStartDate,
          revisionEndDate: subject.revisionEndDate,
          sectionId: newSection.id,
        });
      }
    }

    res.status(201).json(newClassInfo);
  } catch (error) {
    console.error('Error adding class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update existing class info with sections and subjects
router.put('/schools/:schoolId/classes/:id', async (req, res) => {
  const { className, sections } = req.body;

  try {
    const classInfo = await ClassInfo.findByPk(req.params.id);
    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await classInfo.update({ className });

    // Delete existing sections and subjects, then add the new ones
    await Section.destroy({ where: { classInfoId: classInfo.id } });

    for (const sectionName in sections) {
      const newSection = await Section.create({
        sectionName,
        classInfoId: classInfo.id,
        schoolId: req.params.schoolId,
      });

      const subjects = sections[sectionName].subjects || [];
      for (const subject of subjects) {
        await Subject.create({
          subjectName: subject.subjectName,
          academicStartDate: subject.academicStartDate,
          academicEndDate: subject.academicEndDate,
          revisionStartDate: subject.revisionStartDate,
          revisionEndDate: subject.revisionEndDate,
          sectionId: newSection.id,
        });
      }
    }

    res.status(200).json(classInfo);
  } catch (error) {
    console.error('Error updating class info:', error);
    res.status(500).json({ message: 'Error updating class info', error: error.message });
  }
});

// Delete class info, including its sections and subjects
router.delete('/schools/:schoolId/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id, {
      include: [{ model: Section, include: [Subject] }]
    });

    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    for (const section of classInfo.Sections) {
      await Subject.destroy({ where: { sectionId: section.id } });
      await Section.destroy({ where: { id: section.id } });
    }

    await classInfo.destroy();

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting class info:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
