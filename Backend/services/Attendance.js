const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Session = require('./Session');
const Student = require('./Student');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  session_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Session,
      key: 'id',
    },
  },
  student_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('present', 'absent'),
  },
}, {
  timestamps: true,
});

module.exports = Attendance;
