const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure correct path

class ActionsAndRecommendations extends Model {
  static associate(models) {
    ActionsAndRecommendations.belongsTo(models.Session, {
      foreignKey: 'sessionId',
      as: 'Session',
      onDelete: 'CASCADE',
    });
  }
}

ActionsAndRecommendations.init(
  {
    arNumber: { // Adding the A&R Number column
      type: DataTypes.INTEGER,
      autoIncrement: true, // Automatically increments for each new record
      primaryKey: true, // Setting it as the primary key
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sessions',
        key: 'id',
      },
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
      allowNull: true,
    },
    conceptDetailing: {
      type: DataTypes.TEXT,
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
