const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Assignment extends Model {}

Assignment.init({
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id',
    }
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Assignment',
  tableName: 'assignments',
  timestamps: true,
});

module.exports = Assignment;
