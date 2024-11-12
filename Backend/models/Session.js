// models/Session.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Section = require('./Section'); // Import the Section model
const Subject = require('./Subject'); // Import the Subject model
const School = require('./School'); // Import the School model

class Session extends Model {}

Session.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  chapterName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sessionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Section, // Reference the Section model here
      key: 'id',
    },
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject, // Reference the Subject model here
      key: 'id',
    },
  },
  numberOfSessions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priorityNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true,
});

// Define associations
Session.belongsTo(Section, { foreignKey: 'sectionId', onDelete: 'CASCADE' });
Session.belongsTo(Subject, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
Session.belongsTo(School, { foreignKey: 'schoolId' });

module.exports = Session;
