const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TimetableEntry extends Model {
  static associate(models) {
    this.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
    this.belongsTo(models.Subject, { foreignKey: 'subjectId' });
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
  combinedSectionId: {
    type: DataTypes.STRING,
    allowNull: false,
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
