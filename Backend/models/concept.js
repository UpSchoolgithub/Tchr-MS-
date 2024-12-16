const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path to your Sequelize instance

class Concept extends Model {}

Concept.init(
  {
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    concept: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conceptDetailing: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Concept',
    tableName: 'Concepts', // Ensure this matches your database table name
  }
);

module.exports = Concept;
