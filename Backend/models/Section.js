// Section.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Section extends Model {}

Section.init({
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

Section.associate = (models) => {
  Section.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Section.belongsTo(models.School, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Section.hasMany(models.Subject, { foreignKey: 'sectionId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Section.hasMany(models.Student, { foreignKey: 'sectionId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

};

module.exports = Section;
