const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class LessonPlansForActionsAndRecommendations extends Model {}

LessonPlansForActionsAndRecommendations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    actionsAndRecommendationsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ActionsAndRecommendations', // Links to ActionsAndRecommendations table
        key: 'id',
      },
    },
    generatedLessonPlan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'LessonPlansForActionsAndRecommendations',
    tableName: 'LessonPlansForActionsAndRecommendations',
    timestamps: true,
  }
);

module.exports = LessonPlansForActionsAndRecommendations;
