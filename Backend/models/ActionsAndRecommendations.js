const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ActionsAndRecommendations extends Model {}

ActionsAndRecommendations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans', // Links to SessionPlan table
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sessions', // Links to Session table
        key: 'id',
      },
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Chapters', // Links to Chapter table
        key: 'id',
      },
    },
    unitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Units', // Links to Unit table
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
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ActionsAndRecommendations',
    tableName: 'ActionsAndRecommendations',
    timestamps: true,
  }
);

module.exports = ActionsAndRecommendations;
