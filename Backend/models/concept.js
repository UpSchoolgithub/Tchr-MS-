const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path if needed

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
    modelName: 'concept',
    tableName: 'Concepts', // Ensure matches DB table name
  }
);

module.exports = Concept;
