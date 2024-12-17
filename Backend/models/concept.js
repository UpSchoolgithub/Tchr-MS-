const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust as needed

class Concept extends Model {
  static associate(models) {
    this.hasOne(models.LessonPlan, {
      foreignKey: 'conceptId',
      as: 'LessonPlan', // Alias for the association
    });
  }
}

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
    modelName: 'concept', // Model name
    tableName: 'Concepts', // Table name in the DB
  }
);

module.exports = Concept;
