const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class Section extends Model {}

Section.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'ClassInfos',
      key: 'id',
    }
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    }
  }
}, {
  sequelize,
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

module.exports = Section;
