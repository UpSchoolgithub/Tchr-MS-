const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class ManagerSchools extends Model {}

ManagerSchools.init({
  ManagerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'managers', // refers to table name
      key: 'id',
    },
    allowNull: false,
  },
  SchoolId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'schools', // refers to table name
      key: 'id',
    },
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'ManagerSchools',
  tableName: 'ManagerSchools',
  timestamps: false,
});

module.exports = ManagerSchools;
