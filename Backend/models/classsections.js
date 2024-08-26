const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ClassSections extends Model {}

ClassSections.init({
  classInfoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'classinfos',
      key: 'id'
    }
  },
  sectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Sections',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'ClassSections'
});

module.exports = ClassSections;
