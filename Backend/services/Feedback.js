const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

module.exports = Feedback;
