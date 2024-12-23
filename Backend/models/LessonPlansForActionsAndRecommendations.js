const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this is correct

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
        model: 'ActionsAndRecommendations',
        key: 'id',
      },
    },
    // Add additional fields as necessary
    fieldName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'LessonPlansForActionsAndRecommendations',
    tableName: 'LessonPlansForActionsAndRecommendations',
    timestamps: true,
  }
);

// Define associations
LessonPlansForActionsAndRecommendations.associate = (models) => {
  LessonPlansForActionsAndRecommendations.belongsTo(models.ActionsAndRecommendations, {
    foreignKey: 'actionsAndRecommendationsId',
    as: 'ActionsAndRecommendations',
  });
};

module.exports = LessonPlansForActionsAndRecommendations;
