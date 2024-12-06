const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Your Sequelize instance
const Session = require('./Session'); // Import the related Session model

const SessionPlan = sequelize.define('SessionPlan', {
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sessions', // Name of the table being referenced
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
      return value ? JSON.parse(value) : []; // Parse stored JSON string
    },
    set(value) {
      this.setDataValue('planDetails', JSON.stringify(value)); // Convert to JSON string
    },
  },
});

// Define associations
SessionPlan.associate = (models) => {
  // Associate SessionPlan with Session
  SessionPlan.belongsTo(models.Session, { 
    foreignKey: 'sessionId', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE',
  });
};

module.exports = SessionPlan;
