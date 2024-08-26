const express = require('express');
const router = express.Router();
const { Teacher, TimetableEntry, ClassInfo, Section, Subject, School } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateManager = require('../middleware/authenticateManager');
const authenticateTeacherToken = require('../middleware/authenticateTeacherToken');

// Create a new teacher
router.post('/', authenticateManager, async (req, res) => {
  const { name, email, phone, password, schoolIds } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const managerId = req.user.id;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = await Teacher.create({
      name,
      email,
      phoneNumber: phone,
      password: hashedPassword,
      ManagerId: managerId,
    });

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
        through: { attributes: [] }, // This removes the join table attributes
      },
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
        through: { attributes: [] }, // This removes the join table attributes
      },
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
        through: { attributes: [] }, // This removes the join table attributes
      }],
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
    console.log(`Login attempt for email: ${email}`);

    const teacher = await Teacher.findOne({ where: { email } });

    if (!teacher) {
      console.log(`No teacher found with email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      console.log(`Password mismatch for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: teacher.id, isTeacher: true }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log(`Login successful for email: ${email}`);
    res.json({ token, teacherId: teacher.id });

  } catch (error) {
    console.error('Error during login:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Route to fetch sessions for a specific date for the logged-in teacher
router.get('/teacher/sessions', authenticateTeacherToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const dateParam = req.query.date; // Expecting YYYY-MM-DD format
    const date = dateParam ? new Date(dateParam) : new Date();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }); // Get the full weekday name

    // Log to confirm date and day
    console.log(`Fetching sessions for date: ${dateParam}, Day: ${dayOfWeek}`);

    // Fetch sessions for the specified day for the logged-in teacher
    const sessions = await TimetableEntry.findAll({
      where: {
        teacherId,
        day: dayOfWeek // Ensure 'day' field stores names like 'Monday', 'Tuesday', etc.
      },
      include: [
        { model: ClassInfo, attributes: ['name'] },
        { model: Section, attributes: ['name'] },
        { model: Subject, attributes: ['name'] },
        { model: School, attributes: ['name'] },
      ],
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      className: session.ClassInfo ? session.ClassInfo.name : '',
      section: session.Section ? session.Section.name : '',
      subject: session.Subject ? session.Subject.name : '',
      duration: session.duration || '', // Provide default value if missing
      schoolName: session.School ? session.School.name : '',
      sessionStarted: false, // Initial state; implement session tracking logic as needed
      sessionEnded: false, // Initial state
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

