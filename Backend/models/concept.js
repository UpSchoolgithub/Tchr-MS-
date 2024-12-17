const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class concept extends Model {
  static associate(models) {
    this.hasOne(models.LessonPlan, { 
      foreignKey: 'conceptId', 
      as: 'lessonPlan' // Alias for the relation
    });
  }
}

concept.init(
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
    modelName: 'concept', // Lowercase model name
    tableName: 'Concepts', // Table name in DB
  }
);

module.exports = concept;
