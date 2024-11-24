const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

const SessionDetails = sequelize.define('SessionDetails', {
  sessionPlanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SessionPlans',
      key: 'id',
    },
  },
  sessionsToComplete: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  sessionsCompleted: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  assignmentDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  observationDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = SessionDetails;


//to save session details given while submitting the session after completion