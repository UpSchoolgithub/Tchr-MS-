const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Topic = require('./Topic');
const Session = require('./Session'); // Import the Session model

const SessionPlan = sequelize.define('SessionPlan', {
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
  planDetails: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('planDetails');
      return value
        ? JSON.parse(value).map((entry) => ({
            ...entry,
            conceptDetailing: entry.conceptDetailing || "", // Add default value if conceptDetailing is missing
          }))
        : [];
    },
    set(value) {
      // Ensure that `conceptDetailing` is always included when setting the value
      const processedValue = value.map((entry) => ({
        ...entry,
        conceptDetailing: entry.conceptDetailing || "", // Add default value if not provided
      }));
      this.setDataValue('planDetails', JSON.stringify(processedValue));
    },
  },
});

// Define associations in an `associate` method for consistency
SessionPlan.associate = (models) => {
  SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
  SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
};

module.exports = SessionPlan;
