const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class LessonPlan extends Model {
  static associate(models) {
    LessonPlan.belongsTo(models.concept, { foreignKey: 'conceptId', as: 'LessonPlanConcept' }); // Changed alias
  }
}



LessonPlan.init(
  {
    conceptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Concepts', // Matches the table name exactly
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
    modelName: 'LessonPlan', // Model name is 'LessonPlan'
    tableName: 'LessonPlans', // Table name in DB
    freezeTableName: true,
  }
);

module.exports = LessonPlan;
