const express = require('express');
const router = express.Router();
const sequelize = require('../config/db'); // Ensure sequelize is imported for transactions
const ClassInfo = require('../models/ClassInfo');
const Section = require('../models/Section');
const Subject = require('../models/Subject');

// Helper function to validate date order
const validateDateOrder = (dates) => {
  const { academicStartDate, academicEndDate, revisionStartDate, revisionEndDate } = dates;
  console.log(`Validating dates for subject: ${JSON.stringify(dates)}`);
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

// Get all class infos for a school, with sections and subjects grouped under each class
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

// Add a class info with sections and subjects
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, sections } = req.body;
  const transaction = await sequelize.transaction();

  try {
    console.log(`Attempting to create ClassInfo for school ID: ${schoolId}, className: ${className}`);
    const newClassInfo = await ClassInfo.create({ className, schoolId }, { transaction });
    console.log(`Created ClassInfo with ID: ${newClassInfo.id}`);

    for (const sectionName in sections) {
      const newSection = await Section.create(
        { sectionName, classInfoId: newClassInfo.id, schoolId },
        { transaction }
      );
      console.log(`Created Section with ID: ${newSection.id}`);

      const subjects = sections[sectionName].subjects || [];
      for (const subject of subjects) {
        try {
          validateDateOrder(subject);
          const newSubject = await Subject.create(
            { 
              subjectName: subject.subjectName,
              academicStartDate: subject.academicStartDate,
              academicEndDate: subject.academicEndDate,
              revisionStartDate: subject.revisionStartDate,
              revisionEndDate: subject.revisionEndDate,
              sectionId: newSection.id 
            },
            { transaction }
          );
          console.log(`Created Subject: ${newSubject.subjectName} under Section ID: ${newSection.id}`);
        } catch (validationError) {
          console.error('Date validation error:', validationError.message);
          await transaction.rollback();
          return res.status(400).json({ message: validationError.message });
        }
      }
    }

    await transaction.commit();
    res.status(201).json(newClassInfo);
  } catch (error) {
    console.error('Error adding class info:', error);
    await transaction.rollback();
    res.status(500).json({ message: 'Error adding class info', error: error.message });
  }
});

// Update and Delete functions omitted for brevity

module.exports = router;
