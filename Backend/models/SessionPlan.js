// models/SessionPlan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Topic = require('./Topic');

const SessionPlan = sequelize.define('SessionPlan', {
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sessionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  planDetails: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('planDetails');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('planDetails', JSON.stringify(value));
    },
  },
});

SessionPlan.hasMany(Topic, { foreignKey: 'sessionPlanId' });
Topic.belongsTo(SessionPlan, { foreignKey: 'sessionPlanId' });

module.exports = SessionPlan;