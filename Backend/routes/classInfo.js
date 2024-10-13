const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const School = require('../models/School');

// Helper function to validate the order of academic and revision dates
const validateDateOrder = (dates) => {
  const { academicStartDate, academicEndDate, revisionStartDate, revisionEndDate } = dates;
  if (new Date(academicStartDate) >= new Date(academicEndDate)) {
    throw new Error('Academic Start Date must be before Academic End Date.');
  }
  if (new Date(academicEndDate) >= new Date(revisionStartDate)) {
    throw new Error('Academic End Date must be before Revision Start Date.');
  }
  if (new Date(revisionStartDate) >= new Date(revisionEndDate)) {
    throw new Error('Revision Start Date must be before Revision End Date.');
  }
};

// Fetch all class infos with sections and subjects grouped under each class
router.get('/schools/:schoolId/classes', async (req, res) => {
  try {
    const classInfos = await ClassInfo.findAll({
      where: { schoolId: req.params.schoolId },
      include: [{ model: Section, include: [Subject] }]
    });

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
    console.error('Error fetching class infos:', error);
    res.status(500).json({ message: 'Error fetching class infos', error: error.message });
  }
});

// Add a new class info with sections and subjects
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, sections } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // Create the class
    const newClassInfo = await ClassInfo.create({ className, schoolId }, { transaction });

    for (const sectionName in sections) {
      // Find or create the section to ensure subjects are associated with the same section ID
      const [section] = await Section.findOrCreate({
        where: {
          sectionName,
          classInfoId: newClassInfo.id,
          schoolId,
        },
        transaction,
      });

      for (const subject of sections[sectionName].subjects) {
        validateDateOrder(subject);
        
        // Create the subject and link it to the existing or new section ID
        await Subject.create({
          subjectName: subject.subjectName,
          classInfoId: newClassInfo.id,
          sectionId: section.id,  // Use the section ID from findOrCreate
          schoolId,
          academicStartDate: subject.academicStartDate,
          academicEndDate: subject.academicEndDate,
          revisionStartDate: subject.revisionStartDate,
          revisionEndDate: subject.revisionEndDate,
        }, { transaction });
      }
    }

    await transaction.commit();
    res.status(201).json({ message: 'Class, sections, and subjects created successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating class, sections, and subjects:', error);
    res.status(500).json({ message: 'Error creating class, sections, and subjects', error: error.message });
  }
});


// Delete a class info, including its sections and subjects
router.delete('/schools/:schoolId/classes/:id', async (req, res) => {
  try {
    const classInfo = await ClassInfo.findByPk(req.params.id, {
      include: [{ model: Section, include: [Subject] }]
    });

    if (!classInfo) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await Promise.all(classInfo.Sections.map(async (section) => {
      await Subject.destroy({ where: { sectionId: section.id } });
      await Section.destroy({ where: { id: section.id } });
    }));

    await classInfo.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting class info:', error);
    res.status(500).json({ message: 'Error deleting class info', error: error.message });
  }
});

module.exports = router;
