const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Attendance extends Model {}

Attendance.init({
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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Attendance',
  tableName: 'attendances',
  timestamps: true,
});

module.exports = Attendance;
