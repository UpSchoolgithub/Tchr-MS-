const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Section = require('./Section'); // Import related models
const School = require('./School');

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
      model: School,
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'ClassInfo',
  tableName: 'classinfos',
  timestamps: true,
});

// Define associations within the model file
ClassInfo.belongsTo(School, {
  foreignKey: 'schoolId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ClassInfo.hasMany(Section, {
  foreignKey: 'classInfoId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = ClassInfo;
