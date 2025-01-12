const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class SessionPlan extends Model {
  static associate(models) {
    SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', as: 'SessionPlanTopics', onDelete: 'CASCADE' });
    SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'Session' });
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
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sessionEndTime',
    },
    status: {
      type: DataTypes.ENUM('in-progress', 'completed', 'pending'),
      allowNull: false,
      defaultValue: 'in-progress',
    },
  },
  {
    sequelize,
    modelName: 'SessionPlan',
    tableName: 'SessionPlans',
    freezeTableName: true,
  }
);

module.exports = SessionPlan;
