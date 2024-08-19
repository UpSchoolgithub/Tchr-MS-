const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { sequelize, School, TimetableSettings, SchoolCalendar, ClassInfo, Member, Holiday, Session, SessionPlan, Manager } = require('./models');

const classInfoRoutes = require('./routes/classInfo');
const sessionRoutes = require('./routes/session');
const sessionPlanRoutes = require('./routes/sessionPlan');
const memberRoutes = require('./routes/members'); // Import member routes
const managerRoutes = require('./routes/manager');
const schoolRoutes = require('./routes/schoolroutes'); // Adjust the path according to your project structure
const authRoutes = require('./routes/auth');
const managerAuthRoutes = require('./routes/managerAuth'); // Ensure the correct path
const classroomRoutes = require('./routes/classroom'); // Import the new classroom routes
const classroomRouter = require('./routes/classroom'); // Adjust path as necessary
const sectionRoutes = require('./routes/sectionRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const calendarRoutes = require('./routes/calendar');
//const timetableRoutes = require('./routes/mtimetable'); // Ensure this line is present
const subjectRoutes = require('./routes/Msubjects');
const mteacherRoutes = require('./routes/mteacherRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
//const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const testRoutes = require('./routes/testRoutes');
//const studentRoutes = require('./routes/student');
const studentRoutes = require('./routes/students');
const sectionsRouter = require('./routes/students');
const studentsRouter = require('./routes/students')
const app = express();

app.use(helmet());
//app.use(cors({
//  origin: 'https://sm.up.school', // Replace with the allowed origin
 // methods: 'GET,POST,PUT,DELETE', // Specify allowed methods
  //credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  //allowedHeaders: 'Content-Type,Authorization' // Specify allowed headers
//}));

// List of allowed origins
const allowedOrigins = [
  'https://sm.up.school',
  'https://teachermanager.up.school',
  'https://myclasses.up.school'
 
];

// CORS options setup
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request if origin is in the allowed list or not present (non-CORS requests)
    } else {
      callback(new Error('Not allowed by CORS')); // Disallow the request for other origins
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  credentials: true, // Allow credentials (cookies, authorization headers with HTTPS)
  allowedHeaders: ['Content-Type', 'Authorization'] // Specify allowed headers
};

// Apply CORS middleware to all incoming requests
app.use(cors(corsOptions));

// Your existing route definitions
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

sequelize.sync({ alter: true }).then(async () => {
  console.log('Database & tables created!');
});
app.post('/api/schools', async (req, res) => {
  const { name, email, phoneNumber, website, logo } = req.body;
  try {
    const newSchool = await School.create({ name, email, phoneNumber, website, logo });
    console.log('New school created:', newSchool);

    const holidays = [
      { name: 'New Year', date: '2024-01-01', day: 'Monday', schoolId: newSchool.id },
      { name: 'Holi Festival', date: '2024-03-25', day: 'Monday', schoolId: newSchool.id },
      { name: 'Holy Saturday', date: '2024-03-30', day: 'Saturday', schoolId: newSchool.id },
      { name: 'Jumat-Ul-Wida', date: '2024-04-05', day: 'Friday', schoolId: newSchool.id },
      { name: 'Shab-e-Qadar', date: '2024-04-06', day: 'Saturday', schoolId: newSchool.id },
      { name: 'Sri Rama Navami', date: '2024-04-17', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Buddha Poornima', date: '2024-05-23', day: 'Thursday', schoolId: newSchool.id },
      { name: 'Varamahalakshmi Vrata', date: '2024-08-16', day: 'Friday', schoolId: newSchool.id },
      { name: 'Rug-Upakarma, Yajur Upakarma', date: '2024-08-19', day: 'Monday', schoolId: newSchool.id },
      { name: 'Brahma Shri Naryana Guru Jayanthi', date: '2024-08-20', day: 'Tuesday', schoolId: newSchool.id },
      { name: 'Sri Krishna Janmashtami', date: '2024-08-26', day: 'Monday', schoolId: newSchool.id },
      { name: 'Swarna Gowri Vrata', date: '2024-09-06', day: 'Friday', schoolId: newSchool.id },
      { name: 'Vishwakarma Jayanthi', date: '2024-09-17', day: 'Tuesday', schoolId: newSchool.id },
      { name: 'Guru Nanak Jayanthi', date: '2024-11-15', day: 'Friday', schoolId: newSchool.id },
      { name: 'Christmas Eve', date: '2024-12-24', day: 'Tuesday', schoolId: newSchool.id },
      { name: 'New Year’s Day', date: '2025-01-01', day: 'Monday', schoolId: newSchool.id },
      { name: 'Uttarayana Punyakalam', date: '2025-01-14', day: 'Tuesday', schoolId: newSchool.id },
      { name: 'Makar Sankranti Festival', date: '2025-01-14', day: 'Tuesday', schoolId: newSchool.id },
      { name: 'Republic Day', date: '2025-01-26', day: 'Sunday', schoolId: newSchool.id },
      { name: 'Maha Shivaratri', date: '2025-02-26', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Ugadi Festival', date: '2025-03-30', day: 'Sunday', schoolId: newSchool.id },
      { name: 'Dr. B.R. Ambedkar Jayanthi', date: '2025-04-14', day: 'Monday', schoolId: newSchool.id },
      { name: 'Mahaveera Jayanthi', date: '2025-04-14', day: 'Monday', schoolId: newSchool.id },
      { name: 'Good Friday', date: '2025-04-18', day: 'Friday', schoolId: newSchool.id },
      { name: 'Basava Jayanthi, Akshaya Tritiya', date: '2025-04-30', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Khutub E Ramzan', date: '2025-04-30', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Last Day of Muharram', date: '2025-07-25', day: 'Friday', schoolId: newSchool.id },
      { name: 'Independence Day', date: '2025-08-15', day: 'Friday', schoolId: newSchool.id },
      { name: 'Varasiddhi Vinayaka Vrata', date: '2025-08-27', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Mahanavami, Ayudhapooja', date: '2025-10-01', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Vijayadashami', date: '2025-10-02', day: 'Thursday', schoolId: newSchool.id },
      { name: 'Naraka Chaturdashi', date: '2025-10-20', day: 'Monday', schoolId: newSchool.id },
      { name: 'Balipadyami, Deepavali', date: '2025-10-22', day: 'Wednesday', schoolId: newSchool.id },
      { name: 'Kannada Rajyothsava', date: '2025-11-01', day: 'Saturday', schoolId: newSchool.id },
      { name: 'Kanakadasa Jayanthi', date: '2025-11-08', day: 'Saturday', schoolId: newSchool.id }

    ];

    await Holiday.bulkCreate(holidays);
    console.log('Holidays initialized for new school:', newSchool.id);

    res.status(201).json({ newSchool });
  } catch (error) {
    console.error('Error creating school:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


app.post('/api/schools', async (req, res) => {
  const { name, email, phoneNumber, website, logo } = req.body;
  try {
    const newSchool = await School.create({ name, email, phoneNumber, website, logo });
    console.log('New school created:', newSchool);

    // Initialize timetable settings for the new school
    try {
      await TimetableSettings.create({
        schoolId: newSchool.id,
        periodsPerDay: 8,
        durationPerPeriod: 45,
        schoolStartTime: '08:00:00',
        schoolEndTime: '15:00:00',
        assemblyStartTime: '08:00:00',
        assemblyEndTime: '08:15:00',
        lunchStartTime: '12:00:00',
        lunchEndTime: '12:30:00',
        shortBreak1StartTime: '10:00:00',
        shortBreak1EndTime: '10:15:00',
        shortBreak2StartTime: '14:00:00',
        shortBreak2EndTime: '14:15:00',
        reserveType: 'time',
        reserveTimeStart: '15:00:00',
        reserveTimeEnd: '15:30:00',
        reserveDay: 'Monday',
        reserveDayStart: '15:00:00',
        reserveDayEnd: '15:30:00'
      });
      console.log('Timetable settings created for school ID:', newSchool.id);
    } catch (error) {
      console.error('Error creating timetable settings:', error.message);
      return res.status(500).json({ message: 'Failed to create timetable settings', error: error.message });
    }

    // Initialize school calendar for the new school
    try {
      await SchoolCalendar.create({
        schoolId: newSchool.id,
        eventName: 'Default Event',
        dateType: 'continuous',
        startDate: new Date(),
        endDate: new Date(),
      });
      console.log('School calendar created for school ID:', newSchool.id);
    } catch (error) {
      console.error('Error creating school calendar:', error.message);
      return res.status(500).json({ message: 'Failed to create school calendar', error: error.message });
    }

    // Initialize class info for the new school
    try {
      const newClassInfo = await ClassInfo.create({
        schoolId: newSchool.id,
        className: 'Default Class',
        section: 'A',
        subject: 'General',
      });
      console.log('Class info created for school ID:', newSchool.id);

      // Initialize subjects for the new class
      await Subject.create({
        subjectName: 'General',
        classInfoId: newClassInfo.id,
        sectionId: 1,  // Replace with the correct section ID if necessary
        schoolId: newSchool.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Subject created for class info ID:', newClassInfo.id);

    } catch (error) {
      console.error('Error creating class info or subjects:', error.message);
      return res.status(500).json({ message: 'Failed to create class info or subjects', error: error.message });
    }

    // Initialize members for the new school
    try {
      await Members.create({
        schoolId: newSchool.id,
        name: 'Default Name',
        email: `default${newSchool.id}@example.com`,
        phoneNumber: '0000000000',
        location: 'Default Location',
      });
      console.log('Members created for school ID:', newSchool.id);
    } catch (error) {
      console.error('Error creating members:', error.message);
      return res.status(500).json({ message: 'Failed to create members', error: error.message });
    }

    // Initialize holidays for the new school
    try {
      const holidays = predefinedHolidays.map(holiday => ({
        ...holiday,
        schoolId: newSchool.id,
      }));
      await Holiday.bulkCreate(holidays);
      console.log('Holidays created for school ID:', newSchool.id);
    } catch (error) {
      console.error('Error creating holidays:', error.message);
      return res.status(500).json({ message: 'Failed to create holidays', error: error.message });
    }

    res.status(201).json({ newSchool });
  } catch (error) {
    console.error('Error creating school:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Fetch the timetable settings for a specific school
app.get('/api/schools/:id/timetable', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      return res.status(404).send({ message: 'Timetable not found' });
    }
    res.send(timetableSettings);
  } catch (error) {
    console.error('Error fetching timetable settings:', error.message);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Update the timetable settings for a specific school
app.put('/api/schools/:id/timetable', async (req, res) => {
  const schoolId = req.params.id;
  const settings = req.body;
  try {
    let timetableSettings = await TimetableSettings.findOne({ where: { schoolId } });
    if (!timetableSettings) {
      timetableSettings = await TimetableSettings.create({ schoolId, ...settings });
      return res.send({ message: 'Timetable settings created successfully' });
    }
    await timetableSettings.update(settings);
    res.send({ message: 'Timetable settings updated successfully' });
  } catch (error) {
    console.error('Error updating timetable settings:', error.message);
    res.status(500).send({ message: 'Internal server error', error: error.message });
  }
});

// Other school-related routes
app.get('/api/schools', async (req, res) => {
  try {
    const schools = await School.findAll();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.get('/api/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    console.error('Error fetching school:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.put('/api/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  const { name, email, phoneNumber, website, logo } = req.body;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    await school.update({ name, email, phoneNumber, website, logo });
    res.json({ message: 'School updated successfully' });
  } catch (error) {
    console.error('Error updating school:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.delete('/api/schools/:id', async (req, res) => {
  const schoolId = req.params.id;
  try {
    const school = await School.findByPk(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    await school.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting school:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch holidays for a specific school
app.get('/api/schools/:schoolId/holidays', async (req, res) => {
  const { schoolId } = req.params;

  try {
    const holidays = await Holiday.findAll({ where: { schoolId } });
    res.status(200).json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Delete a holiday for a specific school
app.delete('/api/schools/:schoolId/holidays/:holidayId', async (req, res) => {
  const { schoolId, holidayId } = req.params;

  try {
    const holiday = await Holiday.findOne({ where: { id: holidayId, schoolId } });
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }
    await holiday.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting holiday:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Add a holiday for a specific school
app.post('/api/schools/:schoolId/holidays', async (req, res) => {
  const { schoolId } = req.params;
  const { name, date } = req.body;
  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

  try {
    const newHoliday = await Holiday.create({
      name,
      date,
      day,
      schoolId,
    });
    res.status(201).json(newHoliday);
  } catch (error) {
    console.error('Error creating holiday:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Create a new calendar event
app.post('/api/schools/:schoolId/calendar', async (req, res) => {
  const { schoolId } = req.params;
  const { eventName, startDate, endDate, dateType, variableDates } = req.body;

  console.log('Request to create event:', { schoolId, eventName, startDate, endDate, dateType, variableDates });

  if (dateType === 'variable' && !variableDates.length) {
    return res.status(400).json({ message: 'Variable dates cannot be empty' });
  }

  if (dateType === 'continuous' && (!startDate || !endDate)) {
    return res.status(400).json({ message: 'Start date and end date are required for continuous events' });
  }

  try {
    const event = await SchoolCalendar.create({
      schoolId,
      eventName,
      startDate: dateType === 'continuous' ? startDate : null,
      endDate: dateType === 'continuous' ? endDate : null,
      dateType,
      variableDates: dateType === 'variable' ? variableDates : null,
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Fetch all calendar events for a specific school
app.get('/api/schools/:schoolId/calendar', async (req, res) => {
  const { schoolId } = req.params;

  try {
    const events = await SchoolCalendar.findAll({ where: { schoolId } });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a calendar event
app.delete('/api/schools/:schoolId/calendar/:eventId', async (req, res) => {
  const { schoolId, eventId } = req.params;

  try {
    const event = await SchoolCalendar.findOne({ where: { schoolId, id: eventId } });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    await event.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



// Register the classInfo routes
app.use('/api', classInfoRoutes);

// Register the session routes
app.use('/api', sessionRoutes);
app.use('/api', sessionPlanRoutes); // Correct usage

//Reigster the member routes
app.use('/api/members', memberRoutes);

// Register the manager routes
app.use('/api/managers', managerRoutes);

// Login route
app.use('/api/auth', authRoutes);
app.use('/api/manager/auth', managerAuthRoutes); // Ensure the correct path

app.use('/api/classroom', classroomRouter);
app.use('/api', classroomRoutes);  // Register the classroom routes
app.use('/api/classroom', classroomRoutes);

app.use('/api', sectionRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api', subjectRoutes);

app.use('/api', calendarRoutes);
app.use('/api', schoolRoutes);
//app.use('/api/schools/timetable', timetableRoutes); // Ensure the correct path
app.use('/api/timetable', timetableRoutes); // Base path for timetable routes
//app.use('/api/students', studentRoutes);
//app.use('/students', studentRoutes); // Ensure this path matches your frontend API calls
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api', studentRoutes);  // Ensure the route prefix matches the one used in Postman

//app.use('/api', timetableRoutes); // Ensure this line is present
app.use('/api', mteacherRoutes);
app.use('/api', sectionsRouter); // Ensure the route is prefixed correctly
app.use('/api', studentsRouter); // Ensure the route is prefixed correctly

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).send({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: 'An internal error occurred',
    message: err.message,
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
