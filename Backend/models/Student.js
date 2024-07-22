const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define('Student', {
  rollNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
    allowNull: true,
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Student;
