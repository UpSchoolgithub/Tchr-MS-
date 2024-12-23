const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class LessonPlansForActionsAndRecommendations extends Model {
  static associate(models) {
    this.belongsTo(models.ActionsAndRecommendations, {
      foreignKey: 'actionsAndRecommendationsId',
      as: 'ActionsAndRecommendations',
    });
  }
}

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
      references: { model: 'ActionsAndRecommendations', key: 'id' },
    },
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

module.exports = LessonPlansForActionsAndRecommendations;
