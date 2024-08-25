const express = require('express');
const router = express.Router();
const { Teacher, TimetableEntry, ClassInfo, Section, Subject, School } = require('../models'); // Adjust the path as needed
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateManager = require('../middleware/authenticateManager'); // Import the middleware
const jwt = require('jsonwebtoken');

// Create a new teacher
router.post('/', authenticateManager, async (req, res) => {
  const { name, email, phone, password, schoolIds } = req.body;

  try {
    // Check if email already exists
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const managerId = req.user.id;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newTeacher = await Teacher.create({ name, email, phoneNumber: phone, password: hashedPassword, ManagerId: managerId });

    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await newTeacher.setSchools(schools);
    }

    res.status(201).json(newTeacher);
  } catch (error) {
    console.error('Error creating teacher:', error);

    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }

    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      include: {
        model: School,
        through: { attributes: [] } // This removes the join table attributes
      }
    });
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch a single teacher
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: {
        model: School,
        through: { attributes: [] } // This removes the join table attributes
      }
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a teacher
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, schoolIds } = req.body;
  try {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const updatedData = { name, email, phone };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    await teacher.update(updatedData);

    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await teacher.setSchools(schools);
    }

    res.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a teacher
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    await teacher.destroy();
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all teachers for a specific school
router.get('/schools/:schoolId/teachers', async (req, res) => {
  const schoolId = req.params.schoolId;
  try {
    const school = await School.findByPk(schoolId, {
      include: [{
        model: Teacher,
        through: { attributes: [] } // This removes the join table attributes
      }]
    });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.status(200).json(school.Teachers);
  } catch (error) {
    console.error(`Error fetching teachers for schoolId=${schoolId}:`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Teacher login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Log the incoming request details for debugging purposes
    console.log(`Login attempt for email: ${email}`);

    // Fetch the teacher from the database using the provided email
    const teacher = await Teacher.findOne({ where: { email } });

    // If no teacher is found, return an error
    if (!teacher) {
      console.log(`No teacher found with email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, teacher.password);

    // If the passwords do not match, return an error
    if (!isMatch) {
      console.log(`Password mismatch for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token if authentication is successful
    const token = jwt.sign({ id: teacher.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with the generated token and teacherId
    console.log(`Login successful for email: ${email}`);
    res.json({ token, teacherId: teacher.id });

  } catch (error) {
    // Log the full error stack trace for better debugging
    console.error('Error during login:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch sessions for the logged-in teacher
router.get('/teacher/sessions', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.id; // Get teacher ID from the authenticated user
    console.log("Fetching sessions for teacher ID:", teacherId);

    // Fetch the timetable entries (sessions) associated with this teacher
    const sessions = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: ClassInfo, attributes: ['name'] },
        { model: Section, attributes: ['name'] },
        { model: Subject, attributes: ['name'] },
        { model: School, attributes: ['name'] },
      ],
    });

    // Map and format the sessions data for the frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      className: session.ClassInfo.name,
      section: session.Section.name,
      subject: session.Subject.name,
      duration: session.duration,
      schoolName: session.School.name,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;