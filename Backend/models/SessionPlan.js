const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Your Sequelize instance

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
      if (Array.isArray(value)) {
        this.setDataValue('planDetails', JSON.stringify(value)); // Convert to JSON string
      } else {
        throw new Error('planDetails must be an array of objects.');
      }
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

  // Optional: If there are additional models such as `Topic` associated with `SessionPlan`
  // Uncomment the following lines if needed:
  // SessionPlan.hasMany(models.Topic, {
  //   foreignKey: 'sessionPlanId',
  //   onDelete: 'CASCADE',
  //   onUpdate: 'CASCADE',
  // });
};

module.exports = SessionPlan;
