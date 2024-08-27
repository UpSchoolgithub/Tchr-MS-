const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Section extends Sequelize.Model {}

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
      model: 'classinfos',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  combinedSectionId: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

// Add this to handle existing data issues
Section.beforeCreate((section, options) => {
  if (!section.combinedSectionId) {
    section.combinedSectionId = `${section.schoolId}-${section.classInfoId}-${section.sectionName}`;
  }
});

module.exports = Section;
