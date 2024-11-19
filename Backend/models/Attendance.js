// models/Attendance.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust this path to match your project structure

class Attendance extends Model {}

Attendance.init({
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students', // Ensure this matches the table name in your database
      key: 'id',
    },
    onDelete: 'CASCADE', // Optional: handles deletion of student records
    onUpdate: 'CASCADE', // Optional: handles updates to student ID
  },
  sessionId: { // Optional: only add if attendance is linked to specific sessions
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sessions', // Ensure this matches the table name for sessions if using sessions
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  date: {
    type: DataTypes.DATEONLY, // Stores only date, without time
    allowNull: false,
    defaultValue: DataTypes.NOW // Defaults to today's date if not provided
  },
  status: {
    type: DataTypes.ENUM('P', 'A'), // Update to ('Present', 'Absent') if preferred
    allowNull: false,
    comment: 'P = Present, A = Absent',
  },
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendances', // Specify the table name if it differs
  timestamps: true, // Adds createdAt and updatedAt timestamps automatically
});

module.exports = Attendance;
