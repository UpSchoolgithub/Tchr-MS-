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
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'ClassInfo',
  tableName: 'classinfos',
  timestamps: true,
});

// Define associations in the associate method
ClassInfo.associate = (models) => {
  // Associate ClassInfo with School
  ClassInfo.belongsTo(models.School, {
    foreignKey: 'schoolId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // Associate ClassInfo with Section
  ClassInfo.hasMany(models.Section, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = ClassInfo;
