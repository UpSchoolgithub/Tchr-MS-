const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Section extends Model {
  static associate(models) {
    this.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId' });
    this.belongsToMany(models.Subject, { through: 'SectionSubject', foreignKey: 'sectionId' });
  }
}

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
    allowNull: false,
    references: {
      model: 'ClassInfos',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Section',
  tableName: 'sections',
  timestamps: true,
});

module.exports = Section;
