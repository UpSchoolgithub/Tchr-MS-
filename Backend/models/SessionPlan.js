const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this points to your sequelize instance

class SessionPlan extends Model {
  static associate(models) {
    // Define unique aliases for associations
    SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', as: 'PlanTopics', onDelete: 'CASCADE' });
    SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'PlanSession' }); // Changed alias from 'Session' to 'PlanSession'
    SessionPlan.hasMany(models.ActionsAndRecommendations, {
      foreignKey: 'sessionPlanId',
      as: 'PlanActionsAndRecommendations',
      onDelete: 'CASCADE',
    });
  }
}


SessionPlan.init(
  {
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Negative values (-1, -2) for pre-learning; positive for regular sessions.",
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: "Indicates if the session has been completed.",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sessionEndTime', // Use the actual column name from the database
      comment: "Timestamp when the session was ended.",
    },
    status: {
      type: DataTypes.ENUM('in-progress', 'completed', 'pending'),
      allowNull: false,
      defaultValue: 'in-progress',
      comment: "Tracks the status of the session.",
    },
  },
  {
    sequelize,
    modelName: 'SessionPlan',
    tableName: 'SessionPlans',
    freezeTableName: true, // Prevent Sequelize from renaming the table
  }
);

module.exports = SessionPlan;
