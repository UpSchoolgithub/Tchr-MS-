// models/Topic.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Topic = sequelize.define('Topic', {
  sessionPlanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  topicName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Topic;