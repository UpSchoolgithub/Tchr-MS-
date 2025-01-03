const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure the correct path

class Topic extends Model {
  static associate(models) {
    // Association to `SessionPlan`
    Topic.belongsTo(models.SessionPlan, {
      foreignKey: 'sessionPlanId',
      as: 'SessionPlan', // Alias for SessionPlan association
    });

    // Association to `Concept`
    Topic.hasMany(models.Concept, {
      foreignKey: 'topicId',
      as: 'Concepts', // Alias for Concepts association
      onDelete: 'CASCADE', // Delete all related concepts if topic is deleted
    });

    // Association to `PostLearningAction`
    Topic.hasOne(models.PostLearningAction, {
      foreignKey: 'topicId',
      as: 'PostLearningAction', // Alias for PostLearningAction
    });
  }
}

Topic.init(
  {
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans', // References 'SessionPlans' table
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
    freezeTableName: true, // Prevent automatic pluralization
  }
);

module.exports = Topic;
