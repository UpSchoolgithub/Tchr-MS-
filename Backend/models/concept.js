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
      model: 'topics', // References the 'topics' table
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

Concept.associate = (models) => {
  Concept.belongsTo(models.Topic, { foreignKey: 'topicId', onDelete: 'CASCADE' });
};

module.exports = Concept;
