// models/Attendance.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Attendance extends Model {}

Attendance.init({
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'attendances', // Specify the correct table name
  timestamps: true,
});

module.exports = Attendance;
