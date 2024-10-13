const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Section = require('./Section');
const ClassInfo = require('./ClassInfo');
const School = require('./School'); // Import related models

class Subject extends Model {}

Subject.init({
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
      model: Section,
      key: 'id',
    },
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ClassInfo,
      key: 'id',
    },
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: School,
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Subject',
  tableName: 'subjects',
  timestamps: true,
});

// Define associations within the model file
Subject.belongsTo(Section, {
  foreignKey: 'sectionId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Subject.belongsTo(ClassInfo, {
  foreignKey: 'classInfoId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Subject.belongsTo(School, {
  foreignKey: 'schoolId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = Subject;
