// models/Period.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Period = sequelize.define('Period', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  periodNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00',
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00',
  },
}, {
  tableName: 'Periods',
  timestamps: true, // Optional: include timestamps if needed
  createdAt: 'createdAt', // Customize timestamp column names if using timestamps
  updatedAt: 'updatedAt',
});

module.exports = Period;
