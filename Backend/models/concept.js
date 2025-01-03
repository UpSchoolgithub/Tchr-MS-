const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure the correct path

class Concept extends Model {
  static associate(models) {
    // Association to `Topic`
    this.belongsTo(models.Topic, {
      foreignKey: 'topicId',
      as: 'Topic', // Alias for Topic association
    });

    // Association to `LessonPlan`
    this.hasOne(models.LessonPlan, {
      foreignKey: 'conceptId',
      as: 'LessonPlan', // Alias for LessonPlan association
    });
  }
}

Concept.init(
  {
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics', // References the 'Topics' table
        key: 'id',
      },
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
      defaultValue: 'pending', // Default status set to 'pending'
    },
  },
  {
    sequelize,
    modelName: 'Concept',
    tableName: 'Concepts',
  }
);

module.exports = Concept;
