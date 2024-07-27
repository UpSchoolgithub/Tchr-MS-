const { Sequelize } = require('sequelize');
const sequelize = require('./config/db');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const Section = require('./models/Section');
const TimetableEntry = require('./models/TimetableEntry');
const ClassInfo = require('./models/ClassInfo');
const School = require('./models/School'); // Ensure this path is correct

const syncDatabase = async () => {
  try {
    // Define associations
    Teacher.associate({ TimetableEntry });
    Subject.associate({ Section, ClassInfo });
    Section.associate({ Subject, ClassInfo });
    TimetableEntry.associate({ Teacher, Subject, Section });
    School.associate({ Teacher, Subject, Section }); // Adjust this if needed

    // Sync database schema
    await sequelize.sync({ force: true }); // Be cautious with force: true; it drops and recreates tables
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

syncDatabase();
