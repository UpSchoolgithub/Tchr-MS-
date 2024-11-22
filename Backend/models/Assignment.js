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
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions',
        key: 'id',
      },
    },
    assignmentDetails: {
      type: DataTypes.TEXT, // To store long text data
      allowNull: true,
    },
    assignmentFileUrl: {
      type: DataTypes.STRING, // URL of the uploaded file (if any)
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Assignment',
    tableName: 'assignments',
    timestamps: true, // Includes `createdAt` and `updatedAt`
  }
);

module.exports = Assignment;
