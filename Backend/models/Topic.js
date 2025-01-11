const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Topic extends Model {
  static associate(models) {
    // Define associations
    Topic.belongsTo(models.SessionPlan, { 
      foreignKey: 'sessionPlanId', 
      as: 'SessionPlan' 
    });

    Topic.hasMany(models.concept, { 
      foreignKey: 'topicId', 
      as: 'Concepts', 
      onDelete: 'CASCADE' // Ensure cascading deletes
    });
  }
}

Topic.init(
  {
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans', // References 'SessionPlans' table
        key: 'id',
      },
    },
    topicName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the sequelize instance
    modelName: 'Topic', // Ensure the model name matches your conventions
    tableName: 'Topics', // Explicitly set the table name
    freezeTableName: true, // Prevent sequelize from pluralizing table names
  }
);

module.exports = Topic;
