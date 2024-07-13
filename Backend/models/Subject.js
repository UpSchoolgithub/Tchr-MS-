const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Subject extends Model {}

Subject.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ClassInfos',
      key: 'id',
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Sections',
      key: 'id',
    },
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Schools',
      key: 'id',
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Subject',
  tableName: 'subjects',
});

module.exports = Subject;
