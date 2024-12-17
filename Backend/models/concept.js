const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class concept extends Model {
  static associate(models) {
    concept.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'Topic' });
    concept.hasOne(models.LessonPlan, { foreignKey: 'conceptId', as: 'LessonPlan' });
  }
}

concept.init(
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
  },
  {
    sequelize,
    modelName: 'concept', // Model name 'concept' (lowercase)
    tableName: 'Concepts', // Table name in DB
    freezeTableName: true, // Prevents Sequelize from altering table name
  }
);

module.exports = concept;
