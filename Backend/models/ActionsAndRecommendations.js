const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ActionsAndRecommendations extends Model {
  static associate(models) {
    this.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', as: 'SessionPlan' });
    this.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'Session' });
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
      references: {
        model: 'SessionPlans', // References SessionPlans table
        key: 'id',
      },
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sessions', // References Sessions table
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('pre-learning', 'post-learning'),
      allowNull: false,
      validate: {
        isIn: [['pre-learning', 'post-learning']],
      },
    },
    topicName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    conceptName: {
      type: DataTypes.STRING,
      allowNull: true, // Not mandatory for pre-learning or post-learning
      validate: {
        len: [0, 255], // Optional length restriction
      },
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
