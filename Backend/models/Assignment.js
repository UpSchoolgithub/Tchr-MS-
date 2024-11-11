const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Assignment extends Model {}

Assignment.init({
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  assignmentNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Assignment 1, Assignment 2, etc.'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Score of the student in the assignment'
  }
}, {
  sequelize,
  modelName: 'Assignment',
  tableName: 'assignments', // Ensure the table name matches your database
  timestamps: true
});

module.exports = Assignment;
