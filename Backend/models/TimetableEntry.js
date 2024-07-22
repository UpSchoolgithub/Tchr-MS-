const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class TimetableEntry extends Model {
  static associate(models) {
    this.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId' });
    this.belongsTo(models.Section, { foreignKey: 'sectionId' });
    this.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
    this.belongsTo(models.Subject, { foreignKey: 'subjectId' });
    this.belongsTo(models.School, { foreignKey: 'schoolId' });
  }
}

TimetableEntry.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  day: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  period: {
    type: DataTypes.INTEGER,
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
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teachers',
      key: 'id',
    },
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Subjects',
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
}, {
  sequelize,
  modelName: 'TimetableEntry',
  tableName: 'timetable_entries',
  timestamps: true,
});

module.exports = TimetableEntry;
