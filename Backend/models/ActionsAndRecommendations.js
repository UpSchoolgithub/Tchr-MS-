const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ActionsAndRecommendations extends Model {}

ActionsAndRecommendations.init(
  {
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('pre-learning', 'post-learning'),
      allowNull: false,
      comment: 'Defines the type of action (pre/post-learning).',
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
      type: DataTypes.STRING,
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
