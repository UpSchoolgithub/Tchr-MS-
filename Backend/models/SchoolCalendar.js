const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SchoolCalendar = sequelize.define('SchoolCalendar', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools', // Ensure the table name is in lowercase
      key: 'id',
    }
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Default Event',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dateType: {
    type: DataTypes.ENUM('continuous', 'variable'),
    allowNull: false,
    defaultValue: 'continuous',
  },
  variableDates: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'schoolcalendars'
});

module.exports = SchoolCalendar;
