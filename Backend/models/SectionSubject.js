const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class SectionSubject extends Model {}

SectionSubject.init({
  SectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Sections',
      key: 'id',
    }
  },
  SubjectId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Subjects',
      key: 'id',
    }
  }
}, {
  sequelize,
  modelName: 'SectionSubject',
  tableName: 'sectionsubjects',
  timestamps: true,
});

module.exports = SectionSubject;
