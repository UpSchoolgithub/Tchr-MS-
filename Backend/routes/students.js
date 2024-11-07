const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');
const sequelize = require('../config/db');

// Route to upload students
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/students', async (req, res) => {  
  const { sectionId } = req.params;
  const { students } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Find the section to associate students with
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      console.error('Section not found');
      return res.status(404).json({ error: 'Section not found' });
    }

    // Log the student data to confirm structure
    console.log('Student data received:', students);

    // Create student records
    const studentRecords = students.map(student => ({
      rollNumber: student['Roll Number'],
      name: student['Student Name'],
      studentEmail: student['Student Email'],
      studentPhoneNumber: student['Student Phone Number'],
      parentName: student['Parent Name'],
      parentPhoneNumber: student['Parent Phone Number 1'],
      parentPhoneNumber2: student['Parent Phone Number 2 (optional)'],
      parentEmail: student['Parent Email'],
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Student.bulkCreate(studentRecords, { transaction });
    await transaction.commit();
    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to get all students in a specific section
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/students', async (req, res) => {
  const { sectionId } = req.params;

  try {
    const students = await Student.findAll({
      where: { sectionId },
      attributes: [
        'rollNumber',
        'name',
        'studentEmail',
        'studentPhoneNumber',
        'parentName',
        'parentPhoneNumber',
        'parentPhoneNumber2',
        'parentEmail',
      ],
    });

    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to delete a specific student by ID within a section
router.delete('/schools/:schoolId/classes/:classId/sections/:sectionId/students/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const deletedCount = await Student.destroy({ where: { id: studentId } });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

module.exports = router;
