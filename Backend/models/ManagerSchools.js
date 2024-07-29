const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ManagerSchools extends Model {
  static associate(models) {
    this.belongsTo(models.Manager, { foreignKey: 'ManagerId' });
    this.belongsTo(models.School, { foreignKey: 'SchoolId' });
  }
}

ManagerSchools.init({
  ManagerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'managers',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  SchoolId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'schools',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'ManagerSchools',
  tableName: 'managerschools',
  timestamps: false,
});

module.exports = ManagerSchools;
