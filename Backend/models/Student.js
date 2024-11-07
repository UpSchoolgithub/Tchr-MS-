// models/Student.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Student extends Model {}

Student.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
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
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  studentPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/,  // Assuming a 10-digit phone number format
    },
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  parentPhoneNumber1: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/,  // Assuming a 10-digit phone number format
    },
  },
  parentPhoneNumber2: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10}$/,  // Assuming a 10-digit phone number format
    },
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'sections',
      key: 'id',
    },
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Student',
  tableName: 'students',
  timestamps: true,
});

Student.associate = (models) => {
  Student.belongsTo(models.Section, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Student;
