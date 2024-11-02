const express = require('express');
const router = express.Router();
const { Teacher, TimetableEntry, ClassInfo, Section, Subject, School } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateManager = require('../middleware/authenticateManager');
const authenticateTeacherToken = require('../middleware/authenticateTeacherToken');

// 1. Create a new teacher (protected for managers)
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Teacher login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ where: { email } });
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: teacher.id, isTeacher: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, teacherId: teacher.id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Fetch all teachers (protected for managers)
router.get('/', authenticateManager, async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      include: {
        model: School,
        through: { attributes: [] },
      },
    });
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. Fetch a single teacher by ID (protected for managers)
router.get('/:id', authenticateManager, async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: {
        model: School,
        through: { attributes: [] },
      },
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. Update a teacher (protected for managers)
router.put('/:id', authenticateManager, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, schoolIds } = req.body;

  try {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const updatedData = { name, email, phone };
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await teacher.update(updatedData);

    if (schoolIds && schoolIds.length > 0) {
      const schools = await School.findAll({ where: { id: schoolIds } });
      await teacher.setSchools(schools);
    }

    res.json({ message: 'Teacher updated successfully', teacher });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. Delete a teacher (protected for managers)
router.delete('/:id', authenticateManager, async (req, res) => {
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
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 7. Fetch timetable for the logged-in teacher (protected for teachers)
router.get('/:teacherId/timetable', authenticateTeacherToken, async (req, res) => {
  const { teacherId } = req.params;

  if (req.user.id !== parseInt(teacherId, 10)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const timetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: ClassInfo, attributes: ['name'] },
        { model: Section, attributes: ['name'] },
        { model: Subject, attributes: ['name'] },
      ],
      order: [['day', 'ASC'], ['time', 'ASC']],
    });

    const formattedTimetable = timetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      className: entry.ClassInfo.name,
      sectionName: entry.Section.name,
      subjectName: entry.Subject.name,
      time: entry.time,
    }));

    res.json(formattedTimetable);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 8. Fetch sessions for a specific date for the logged-in teacher
router.get('/teacher/sessions', authenticateTeacherToken, async (req, res) => {
  const teacherId = req.user.id;
  const dateParam = req.query.date;
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const sessions = await TimetableEntry.findAll({
      where: { teacherId, day: dayOfWeek },
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
      duration: session.duration || '',
      schoolName: session.School ? session.School.name : '',
      sessionStarted: false,
      sessionEnded: false,
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch timetable for a specific teacher
router.get('/:teacherId/timetable', async (req, res) => {
  const { teacherId } = req.params;

  try {
    const timetable = await TimetableEntry.findAll({
      where: { teacherId },
      include: [
        { model: ClassInfo, attributes: ['className'], as: 'classInfo' },
        { model: Section, attributes: ['sectionName'], as: 'section' },
        { model: Subject, attributes: ['subjectName'], as: 'subject' },
        { model: School, attributes: ['name'], as: 'school' }
      ],
      order: [['day', 'ASC'], ['period', 'ASC']]
    });

    const formattedTimetable = timetable.map(entry => ({
      id: entry.id,
      day: entry.day,
      period: entry.period,
      schoolName: entry.school ? entry.school.name : 'N/A',
      className: entry.classInfo ? entry.classInfo.className : 'N/A',
      sectionName: entry.section ? entry.section.sectionName : 'N/A',
      subjectName: entry.subject ? entry.subject.subjectName : 'N/A',
      startTime: entry.startTime,
      endTime: entry.endTime
    }));

    res.status(200).json(formattedTimetable);
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
