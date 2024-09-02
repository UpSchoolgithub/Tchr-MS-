const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TeacherTimetable extends Model {
  static associate(models) {
    this.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
    this.belongsTo(models.School, { foreignKey: 'schoolId' });
    this.belongsTo(models.ClassInfo, { foreignKey: 'classId' });
    this.belongsTo(models.Section, { foreignKey: 'combinedSectionId', targetKey: 'combinedSectionId' });
    this.belongsTo(models.TimetableEntry, { foreignKey: 'timetableEntryId' }); // <-- Add this association
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
  },
  combinedSectionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'TeacherTimetable',
  tableName: 'teacher_timetables',
  timestamps: true,
});

module.exports = TeacherTimetable;
