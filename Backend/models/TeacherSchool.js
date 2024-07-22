// models/TeacherSchool.js
const { Model } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct

class TeacherSchool extends Model {}

TeacherSchool.init({}, {
  sequelize,
  modelName: 'TeacherSchool',
  tableName: 'teacher_schools',
  timestamps: false,
});

module.exports = TeacherSchool;
