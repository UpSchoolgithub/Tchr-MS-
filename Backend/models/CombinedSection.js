const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class CombinedSection extends Model {}

CombinedSection.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'CombinedSection',
  tableName: 'combined_sections',
  timestamps: true,
});

module.exports = CombinedSection;
