const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TeacherSchools extends Model {}

TeacherSchools.init({
  teacherId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'teachers',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  schoolId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'schools',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'TeacherSchools',
  tableName: 'teacher_schools',
  timestamps: true,
});

module.exports = TeacherSchools;
