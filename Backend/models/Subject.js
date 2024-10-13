// models/Subject.js
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
  academicStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  academicEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  revisionStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  revisionEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections',
      key: 'id',
    },
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classinfos',
      key: 'id',
    },
  }
}, {
  sequelize,
  modelName: 'Subject',
  tableName: 'subjects',
  timestamps: true,
});

Subject.associate = (models) => {
  Subject.belongsTo(models.Section, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Subject.belongsTo(models.ClassInfo, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Subject;
