const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Assignment extends Model {}

Assignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SessionPlans',
        key: 'id',
      },
    },
    assignmentDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignmentFileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Assignment',
    tableName: 'assignments',
    timestamps: true,
  }
);

module.exports = Assignment;
