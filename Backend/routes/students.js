const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');
const sequelize = require('../config/db');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to upload students from an Excel file
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/students', upload.single('file'), async (req, res) => {
  const { sectionId } = req.params;
  const transaction = await sequelize.transaction();

  try {
    // Find the section to associate students with
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Read and parse the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(worksheet);

    // Validate Excel columns
    const requiredColumns = ['Roll Number', 'Student Name', 'Student Email', 'Student Phone Number', 'Parent Name', 'Parent Phone Number 1', 'Parent Email'];
    const missingColumns = requiredColumns.filter(col => !students[0].hasOwnProperty(col));
    if (missingColumns.length > 0) {
      return res.status(400).json({ error: `Missing columns in Excel file: ${missingColumns.join(', ')}` });
    }

    // Create student records
    const studentRecords = students.map(student => ({
      rollNumber: student['Roll Number'],
      studentName: student['Student Name'],
      studentEmail: student['Student Email'],
      studentPhoneNumber: student['Student Phone Number'],
      parentName: student['Parent Name'],
      parentPhoneNumber1: student['Parent Phone Number 1'],
      parentPhoneNumber2: student['Parent Phone Number 2 (optional)'] || null,
      parentEmail: student['Parent Email'],
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk create with transaction and handle duplicates
    try {
      await Student.bulkCreate(studentRecords, { transaction });
      await transaction.commit();
      res.status(201).json({ message: 'Students uploaded successfully' });
    } catch (bulkError) {
      await transaction.rollback();
      console.error('Error in bulk create:', bulkError);
      res.status(500).json({ error: 'Failed to upload some students. Check for duplicate roll numbers.' });
    }

    // Delete the uploaded file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to fetch students
router.get('/schools/:schoolId/classes/:classId/sections/:sectionId/students', async (req, res) => {
  const { sectionId } = req.params;

  try {
    const students = await Student.findAll({
      where: { sectionId },
      attributes: [
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
      return res.status(404).json({ message: 'No students found for this section' });
    }

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
