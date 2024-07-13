const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust this path if needed

class Holiday extends Model {}

Holiday.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Holiday',
  timestamps: true,
});

module.exports = Holiday;
