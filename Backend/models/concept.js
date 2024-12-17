const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Concept extends Model {
  static associate(models) {
    this.hasOne(models.LessonPlan, { foreignKey: 'conceptId', as: 'LessonPlan' });
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
    modelName: 'concept',
    tableName: 'Concepts',
  }
);

module.exports = Concept;
