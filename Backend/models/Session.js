const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Session extends Model {}

Session.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  classId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'ClassInfos',
      key: 'id',
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Sections',
      key: 'id',
    },
  },
  subjectId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Subjects',
      key: 'id',
    },
  },
  chapterName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numberOfSessions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priorityNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lessonPlan: {
    type: DataTypes.STRING,
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
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true,
});

module.exports = Session;
