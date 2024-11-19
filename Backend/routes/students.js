const express = require('express');
const router = express.Router();
const { Section, Student } = require('../models');
const sequelize = require('../config/db');
const multer = require('multer');
const XLSX = require('xlsx');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload students from an Excel file
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/students', upload.single('file'), async (req, res) => {
  const { sectionId } = req.params;

  console.log('Headers:', req.headers); // Log headers for debugging
  console.log('File:', req.file); // Log file to ensure it is received
  console.log('Body:', req.body); // Log body for additional debugging

  if (!req.file) {
    return res.status(400).json({ error: 'File not uploaded. Please ensure the field name is "file".' });
  }

  const transaction = await sequelize.transaction();

  try {
    // Verify section exists
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Section not found' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(worksheet);

    console.log('Parsed students:', students); // Log parsed data for debugging

    // Map and format student data for bulk insert
    const studentRecords = students.map((student) => ({
      rollNumber: student['Roll Number'],
      studentName: student['Student Name'],
      studentEmail: student['Student Email'],
      studentPhoneNumber: student['Student Phone Number'],
      parentName: student['Parent Name'],
      parentPhoneNumber1: student['Parent Phone Number 1'],
      parentPhoneNumber2: student['Parent Phone Number 2 (optional)'] || null,
      parentEmail: student['Parent Email'] || null,
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Bulk insert student records
    await Student.bulkCreate(studentRecords, { transaction, ignoreDuplicates: true });
    await transaction.commit();

    res.status(201).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in student upload route:', error);
    res.status(400).json({ error: error.message || 'Error uploading students.' });
  }
});


// Route to add a student manually
router.post('/schools/:schoolId/classes/:classId/sections/:sectionId/students/manual', async (req, res) => {
  const { sectionId } = req.params;
  const {
    rollNumber,
    studentName,
    studentEmail,
    studentPhoneNumber,
    parentName,
    parentPhoneNumber1,
    parentPhoneNumber2,
    parentEmail,
  } = req.body;

  try {
    console.log('Incoming request body:', req.body);

    // Validate required fields
    if (!rollNumber || !studentName || !studentPhoneNumber || !parentName) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify if section exists
    const section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      console.error(`Section with ID ${sectionId} not found`);
      return res.status(404).json({ error: 'Section not found' });
    }

    // Insert new student data
    const newStudent = await Student.create({
      rollNumber,
      studentName,
      studentEmail,
      studentPhoneNumber,
      parentName,
      parentPhoneNumber1,
      parentPhoneNumber2: parentPhoneNumber2 || null,
      parentEmail: parentEmail || null,
      sectionId: section.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: 'Student added successfully', student: newStudent });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(400).json({ error: error.message || 'Error adding student' });
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

    // Return empty array instead of 404 if no students are found
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
