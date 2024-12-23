const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ActionsAndRecommendations extends Model {
  static associate(models) {
    this.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', as: 'SessionPlan' });
    this.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'Session' });
    this.belongsTo(models.Chapter, { foreignKey: 'chapterId', as: 'Chapter' });
    this.belongsTo(models.Unit, { foreignKey: 'unitId', as: 'Unit' });
    this.hasOne(models.LessonPlansForActionsAndRecommendations, {
      foreignKey: 'actionsAndRecommendationsId',
      as: 'LessonPlan',
    });
  }
}

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
      references: { model: 'SessionPlans', key: 'id' },
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Sessions', key: 'id' },
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Chapters', key: 'id' },
    },
    unitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Units', key: 'id' },
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
