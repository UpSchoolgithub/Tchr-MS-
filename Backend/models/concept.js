const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Concept extends Model {
  static associate(models) {
    this.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'Topic' });
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending', // Default to 'pending'
    },
  },
  {
    sequelize,
    modelName: 'concept',
    tableName: 'Concepts',
  }
);

module.exports = Concept;
