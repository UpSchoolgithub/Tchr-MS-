const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Section extends Model {}

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
    allowNull: true, // Set during timetable creation or any custom needs
  }
}, {
  sequelize,
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

Section.associate = (models) => {
  Section.belongsTo(models.ClassInfo, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Section.belongsTo(models.School, {
    foreignKey: 'schoolId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Section.hasMany(models.Subject, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Section.hasMany(models.Student, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Section;
