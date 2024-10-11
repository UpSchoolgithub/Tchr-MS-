const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ClassInfo extends Model {}

ClassInfo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  className: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
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
  }
}, {
  sequelize,
  modelName: 'ClassInfo',
  tableName: 'classinfos',
  timestamps: true,
});

ClassInfo.associate = (models) => {
  ClassInfo.hasMany(models.Section, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = ClassInfo;
