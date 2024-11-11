// models/Test.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Test extends Model {}

Test.init({
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  testNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Test 1, Test 2, etc.'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Score of the student in the test'
  }
}, {
  sequelize,
  modelName: 'Test',
  tableName: 'tests', // Explicitly define the table name here
  timestamps: true
});

module.exports = Test;
