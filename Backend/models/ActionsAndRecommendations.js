const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import Sequelize instance

class ActionsAndRecommendations extends Model {
  static associate(models) {
    // Each A&R belongs to a SessionPlan
    ActionsAndRecommendations.belongsTo(models.SessionPlan, {
      foreignKey: 'sessionPlanId',
      as: 'SessionPlan',
      onDelete: 'CASCADE',
    });
  }
}

ActionsAndRecommendations.init(
  {
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('pre-learning', 'post-learning'),
      allowNull: false,
    },
    topicName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conceptName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conceptDetailing: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ActionsAndRecommendations',
    tableName: 'ActionsAndRecommendations',
    freezeTableName: true,
  }
);

module.exports = ActionsAndRecommendations;
