const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path based on your project structure

const SessionReport = sequelize.define('SessionReport', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  teacherName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  className: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sectionName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  subjectName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  schoolName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  absentStudents: {
    type: DataTypes.JSON,
    allowNull: true, // Optional field to store absent student details
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
}, {
  tableName: 'SessionReports',
  timestamps: true,
});

module.exports = SessionReport;
