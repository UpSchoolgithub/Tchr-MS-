const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Concept = sequelize.define('Concept', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'topics', // Reference to 'topics' table
      key: 'id',
    },
  },
  concept: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conceptDetailing: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = Concept;
