const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust as needed

class LessonPlan extends Model {
  static associate(models) {
    // Properly associating with Concept model
    this.belongsTo(models.Concept, { 
      foreignKey: 'conceptId', 
      as: 'Concept' // Alias for the association
    });
  }
}

LessonPlan.init(
  {
    conceptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Concepts', // Table name in the database
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
    tableName: 'LessonPlans', // Ensure table name matches DB
  }
);

module.exports = LessonPlan;
