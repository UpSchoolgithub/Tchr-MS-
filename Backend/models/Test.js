const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Test extends Model {}

Test.init({
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
  modelName: 'Test',
  tableName: 'tests',
  timestamps: true,
});

module.exports = Test;
