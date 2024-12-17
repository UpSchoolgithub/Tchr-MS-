const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class LessonPlan extends Model {
  static associate(models) {
    this.belongsTo(models.Concept, { foreignKey: 'conceptId', as: 'Concept' });
  }
}

LessonPlan.init(
  {
    conceptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Concepts', // References Concepts table
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
    tableName: 'LessonPlans',
  }
);

module.exports = LessonPlan;
