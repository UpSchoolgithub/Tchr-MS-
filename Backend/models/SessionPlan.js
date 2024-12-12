const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SessionPlan = sequelize.define('SessionPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sessions', // References the 'sessions' table
      key: 'id',
    },
  },
  sessionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  topicName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

SessionPlan.associate = (models) => {
  SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
  SessionPlan.hasMany(models.Concept, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
};

module.exports = SessionPlan;
