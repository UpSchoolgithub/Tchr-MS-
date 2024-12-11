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
          throw new Error("Invalid planDetails format");
        }
        return parsedValue;
      } catch (error) {
        console.error("Error parsing planDetails:", error);
        return [];
      }
    },
    set(value) {
      if (!Array.isArray(value)) {
        throw new Error("planDetails must be an array");
      }
      this.setDataValue('planDetails', JSON.stringify(value));
    },
  },
  
});

// Define associations in an `associate` method for consistency
SessionPlan.associate = (models) => {
  SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
  SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
};

module.exports = SessionPlan;
