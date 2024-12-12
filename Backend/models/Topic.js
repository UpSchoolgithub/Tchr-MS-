const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Topic = sequelize.define('Topic', {
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
  topicName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Topic.associate = (models) => {
  Topic.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', onDelete: 'CASCADE' });
  Topic.hasMany(models.Concept, { foreignKey: 'topicId', onDelete: 'CASCADE' });
};

module.exports = Topic;
