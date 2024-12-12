const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Concept = sequelize.define('Concept', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sessionPlanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SessionPlans', // References the 'SessionPlans' table
      key: 'id',
    },
  },
  concept: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conceptDetailing: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

Concept.associate = (models) => {
  Concept.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
  Concept.hasOne(models.LessonPlan, { foreignKey: 'conceptId', onDelete: 'CASCADE' });
};

module.exports = Concept;
