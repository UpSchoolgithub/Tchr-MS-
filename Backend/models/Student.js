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
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  studentEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  parentPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  parentPhoneNumber2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  parentEmail: {
    type: DataTypes.STRING,
    allowNull: true,
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
