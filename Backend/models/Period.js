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
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
}, {
  tableName: 'periods', // Explicitly define the table name as lowercase
  timestamps: false, // If you don't want createdAt/updatedAt columns
});

module.exports = Period;
