const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CombinedSection = require('./CombinedSection');

class Student extends Model {}

Student.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rollNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentPhoneNumber1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentPhoneNumber2: {
    type: DataTypes.STRING,
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  combinedSectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CombinedSection,
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Student',
  tableName: 'students',
  timestamps: true,
});

module.exports = Student;
