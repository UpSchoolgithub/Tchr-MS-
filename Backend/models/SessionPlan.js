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
      try {
        const parsedValue = value ? JSON.parse(value) : [];
        if (!Array.isArray(parsedValue)) {
          throw new Error('Invalid planDetails format');
        }
        return parsedValue.map((entry) => ({
          topicName: entry.topicName || "Unnamed Topic",
          concept: entry.concept || "No Concept",
          conceptDetailing: entry.conceptDetailing || "No Detailing Provided",
          lessonPlan: entry.lessonPlan || "",
        }));
      } catch (error) {
        console.error('Error parsing planDetails:', error);
        return [];
      }
    },
    set(value) {
      const validatedValue = value.map((entry) => ({
        topicName: entry.topicName || "Unnamed Topic",
        concept: entry.concept || "No Concept",
        conceptDetailing: entry.conceptDetailing || "No Detailing Provided",
        lessonPlan: entry.lessonPlan || "",
      }));
      this.setDataValue('planDetails', JSON.stringify(validatedValue));
    },
  },
});

// Define associations in an `associate` method for consistency
SessionPlan.associate = (models) => {
  SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
  SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
};

module.exports = SessionPlan;
