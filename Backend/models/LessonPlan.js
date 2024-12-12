const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LessonPlan = sequelize.define('LessonPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conceptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Concepts', // References the 'Concepts' table
      key: 'id',
    },
  },
  generatedLP: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

LessonPlan.associate = (models) => {
  LessonPlan.belongsTo(models.Concept, { foreignKey: 'conceptId', onDelete: 'CASCADE' });
};

module.exports = LessonPlan;
