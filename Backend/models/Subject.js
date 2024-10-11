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
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classinfos',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections',
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
  Subject.belongsTo(models.School, {
    foreignKey: 'schoolId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Subject;
