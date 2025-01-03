const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure the correct path

class PostLearningAction extends Model {
  static associate(models) {
    // Associations
    this.belongsTo(models.Topic, { as: 'topic', foreignKey: 'topicId' });
  }
}

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
    tableName: 'PostLearningActions',
    timestamps: true,
  }
);

module.exports = PostLearningAction;
