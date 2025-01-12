const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Topic extends Model {
  static associate(models) {
    Topic.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', as: 'RelatedSessionPlan' });
    Topic.hasMany(models.concept, { foreignKey: 'topicId', as: 'TopicConcepts', onDelete: 'CASCADE' });
  }
}

Topic.init(
  {
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans',
        key: 'id',
      },
    },
    topicName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Topic',
    tableName: 'Topics',
    freezeTableName: true,
  }
);

module.exports = Topic;
