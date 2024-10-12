// models/TeacherTimetable.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TeacherTimetable extends Model {
  static associate(models) {
    this.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
    this.belongsTo(models.School, { foreignKey: 'schoolId' });
    this.belongsTo(models.ClassInfo, { foreignKey: 'classId' });
    this.belongsTo(models.Section, { foreignKey: 'sectionId' });  // Using sectionId to associate with Section model
    this.belongsTo(models.Subject, { foreignKey: 'subjectId' });  // New association to reference a specific subject
    this.belongsTo(models.TimetableEntry, { foreignKey: 'timetableEntryId' });
  }
}

TeacherTimetable.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  timetableEntryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'timetable_entries',
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
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classinfos',
      key: 'id',
    },
  },
  sectionId: {   // Link directly to Section model
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections',  // Referencing the Section model's id
      key: 'id',
    },
  },
  subjectId: {   // Link directly to Subject model
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',  // Referencing the Subject model's id
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'TeacherTimetable',
  tableName: 'teacher_timetables',
  timestamps: true,
});

module.exports = TeacherTimetable;
