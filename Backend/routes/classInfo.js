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
    const { board, classId, sectionId, subjectId } = req.query; // Add query parameters for filtering
    const whereClause = { schoolId: req.params.schoolId };
    if (board) whereClause.board = board;
    if (classId) whereClause.id = classId; // Filter by classId if provided

    const classInfos = await ClassInfo.findAll({
      where: whereClause,
      include: [
        {
          model: Section,
          required: sectionId ? true : false,
          where: sectionId ? { id: sectionId } : {}, // Filter by sectionId if provided
          include: [
            {
              model: Subject,
              required: subjectId ? true : false,
              where: subjectId ? { id: subjectId } : {}, // Filter by subjectId if provided
            },
          ],
        },
      ],
    });

    if (!classInfos.length) {
      return res.status(404).json({ message: 'No matching class, section, or subject found' });
    }

    const formattedClasses = classInfos.map((classInfo) => {
      const sections = {};
      classInfo.Sections.forEach((section) => {
        sections[section.sectionName] = {
          id: section.id,
          schoolId: section.schoolId,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          subjects: section.Subjects.map((subject) => ({
            id: subject.id,
            subjectName: subject.subjectName,
            academicStartDate: subject.academicStartDate,
            academicEndDate: subject.academicEndDate,
            revisionStartDate: subject.revisionStartDate,
            revisionEndDate: subject.revisionEndDate,
          })),
        };
      });
      return {
        id: classInfo.id,
        className: classInfo.className,
        board: classInfo.board,
        schoolId: classInfo.schoolId,
        sections,
      };
    });

    res.status(200).json(formattedClasses);
  } catch (error) {
    console.error('Error fetching class infos:', error);
    res.status(500).json({ message: 'Error fetching class infos', error: error.message });
  }
});


// Route to create a new class with sections and subjects
router.post('/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { className, board, sections } = req.body;

  if (!board || !['ICSE', 'CBSE', 'STATE'].includes(board)) {
    return res.status(400).json({ message: 'Invalid or missing board type.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const newClass = await ClassInfo.create({ className, board, schoolId }, { transaction });

    if (sections) {
      for (const [sectionName, sectionData] of Object.entries(sections)) {
        const newSection = await Section.create(
          { sectionName, classInfoId: newClass.id, schoolId },
          { transaction }
        );

        if (sectionData.subjects) {
          for (const subject of sectionData.subjects) {
            validateDateOrder(subject);

            await Subject.create(
              {
                sectionId: newSection.id,
                classInfoId: newClass.id,
                schoolId,
                subjectName: subject.subjectName,
                academicStartDate: subject.academicStartDate,
                academicEndDate: subject.academicEndDate,
                revisionStartDate: subject.revisionStartDate,
                revisionEndDate: subject.revisionEndDate,
              },
              { transaction }
            );
          }
        }
      }
    }

    await transaction.commit();
    res.status(201).json({ message: 'Class, sections, and subjects created successfully', classId: newClass.id });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating class with sections and subjects:', error);
    res.status(500).json({ message: 'Error creating class with sections and subjects', error: error.message });
  }
});



// Route to add sections and subjects to an existing class
// Route to add sections and subjects to an existing class
router.post('/classes/:classId/sections', async (req, res) => {
  const { classId } = req.params;
  const { sections, schoolId } = req.body;

  const transaction = await sequelize.transaction();
  try {
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      let section = await Section.findOne({
        where: { sectionName, classInfoId: classId, schoolId },
        transaction,
      });

      if (!section) {
        section = await Section.create(
          {
            sectionName,
            classInfoId: classId,
            schoolId,
          },
          { transaction }
        );
      }

      if (sectionData.subjects) {
        for (const subject of sectionData.subjects) {
          const existingSubject = await Subject.findOne({
            where: {
              sectionId: section.id,
              classInfoId: classId,
              subjectName: subject.subjectName,
            },
            transaction,
          });

          if (!existingSubject) {
            validateDateOrder(subject);

            await Subject.create(
              {
                sectionId: section.id,
                classInfoId: classId,
                schoolId,
                subjectName: subject.subjectName,
                academicStartDate: subject.academicStartDate,
                academicEndDate: subject.academicEndDate,
                revisionStartDate: subject.revisionStartDate,
                revisionEndDate: subject.revisionEndDate,
              },
              { transaction }
            );
            
          }
        }
      }
    }

    await transaction.commit();
    res.status(201).json({ message: 'Sections and subjects added successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error adding sections and subjects:', error);
    res.status(500).json({ message: 'Error adding sections and subjects', error: error.message });
  }
});



// Route to update an existing subject
router.put('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  const { academicStartDate, academicEndDate, revisionStartDate, revisionEndDate } = req.body;

  try {
    // Validate date order
    validateDateOrder({ academicStartDate, academicEndDate, revisionStartDate, revisionEndDate });

    // Update subject
    const [updatedCount] = await Subject.update(
      { academicStartDate, academicEndDate, revisionStartDate, revisionEndDate },
      { where: { id: subjectId } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Subject not found or no changes made' });
    }

    res.status(200).json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ message: 'Error updating subject', error: error.message });
  }
});

// Route to delete a class along with its sections and subjects
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

// Route to delete a specific subject within a section of a class
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/subjects/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  try {
    const deletedCount = await Subject.destroy({ where: { id: subjectId } });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
});


module.exports = router;
