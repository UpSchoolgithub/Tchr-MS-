const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Session = require('./Session');

const Test = sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  session_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Session,
      key: 'id',
    },
  },
  details: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
});

module.exports = Test;
