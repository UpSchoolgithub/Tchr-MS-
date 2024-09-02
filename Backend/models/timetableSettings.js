const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TimetableSettings = sequelize.define('TimetableSettings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  periodsPerDay: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  durationPerPeriod: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  schoolStartTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  schoolEndTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  assemblyStartTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  assemblyEndTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  lunchStartTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  lunchEndTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  shortBreak1StartTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  shortBreak1EndTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  shortBreak2StartTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  shortBreak2EndTime: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  reserveType: {
    type: DataTypes.STRING,
    defaultValue: 'time',
  },
  reserveTimeStart: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  reserveTimeEnd: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00',
  },
  reserveDay: {
    type: DataTypes.JSON,
    defaultValue: {},
  }
});

module.exports = TimetableSettings;
