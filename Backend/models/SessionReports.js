const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path based on project structure

const SessionReports = sequelize.define('SessionReports', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sessionPlanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  absentStudents: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  sessionsToComplete: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  sessionsCompleted: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  assignmentDetails: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  observationDetails: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completedTopics: {
    type: DataTypes.JSON,
    allowNull: true, // Can be null initially
},

});

module.exports = SessionReports;
