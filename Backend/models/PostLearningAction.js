const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Update the path as per your project structure

class PostLearningAction extends Model {}

PostLearningAction.init(
  {
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    conceptIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER), // Stores an array of concept IDs
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('pre-learning', 'post-learning'),
      allowNull: false,
    },
    additionalDetails: {
      type: DataTypes.TEXT, // Optional field for extra details if needed
    },
  },
  {
    sequelize,
    modelName: 'PostLearningAction',
    tableName: 'post_learning_actions',
    timestamps: true,
  }
);

module.exports = PostLearningAction;
