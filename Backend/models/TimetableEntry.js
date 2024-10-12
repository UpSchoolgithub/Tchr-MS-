// models/TimetableEntry.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TimetableEntry extends Model {
  static associate(models) {
    this.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
    this.belongsTo(models.Subject, { foreignKey: 'subjectId' });
    this.belongsTo(models.School, { foreignKey: 'schoolId' });
    this.belongsTo(models.ClassInfo, { foreignKey: 'classId' });
    this.belongsTo(models.Section, { foreignKey: 'sectionId' }); // Use sectionId instead of combinedSectionId
    this.hasMany(models.TeacherTimetable, { foreignKey: 'timetableEntryId' });
  }
}

TimetableEntry.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sectionId: {  // Replace combinedSectionId with sectionId
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections', // References Section model
      key: 'id',
    },
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id',
    },
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'teachers',
      key: 'id',
    },
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  period: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'TimetableEntry',
  tableName: 'timetable_entries',
  timestamps: true,
});

module.exports = TimetableEntry;
