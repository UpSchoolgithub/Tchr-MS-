const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this points to your sequelize instance

class SessionPlan extends Model {
  static associate(models) {
    SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', as: 'Topics', onDelete: 'CASCADE' });
    SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'Session' });
    SessionPlan.hasMany(models.ActionsAndRecommendations, {
      foreignKey: 'sessionPlanId',
      as: 'ActionsAndRecommendations',
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
      field: 'sessionEndTime', // Use the actual column name from the database
    },
    status: {
      type: DataTypes.STRING,
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
