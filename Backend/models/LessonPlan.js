const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class LessonPlan extends Model {
  static associate(models) {
    // Reference the correct model name 'concept'
    this.belongsTo(models.concept, { 
      foreignKey: 'conceptId', 
      as: 'concept' // Alias matches the model name
    });
  }
}

LessonPlan.init(
  {
    conceptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Concepts', // Ensure it matches the table name
        key: 'id',
      },
    },
    generatedLP: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'LessonPlan',
    tableName: 'LessonPlans', // Table name in DB
  }
);

module.exports = LessonPlan;
