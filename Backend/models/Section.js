const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ClassInfo = require('./ClassInfo');
const School = require('./School');
const Subject = require('./Subject'); // Import related models

class Section extends Model {}

Section.init({
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false,
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
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

// Define associations within the model file
Section.belongsTo(ClassInfo, {
  foreignKey: 'classInfoId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Section.belongsTo(School, {
  foreignKey: 'schoolId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Section.hasMany(Subject, {
  foreignKey: 'sectionId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = Section;
