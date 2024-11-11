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
    type: DataTypes.ENUM('P', 'A'),
    allowNull: false,
    comment: 'P = Present, A = Absent',
  }
}, {
  sequelize,
  modelName: 'Attendance',
});

module.exports = Attendance;
