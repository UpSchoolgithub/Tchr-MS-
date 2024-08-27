const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TeacherTimetable extends Model {}

TeacherTimetable.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teachers',
      key: 'id',
    },
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  combinedSectionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  period: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'TeacherTimetable',
  tableName: 'teacher_timetables',
  timestamps: true,
});

module.exports = TeacherTimetable;
