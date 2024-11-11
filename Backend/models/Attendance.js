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
  date: {
    type: DataTypes.DATEONLY, // Stores only date, without time
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('P', 'A'),
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
