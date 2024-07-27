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
  section: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  academicStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  academicEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  revisionStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  revisionEndDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    }
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
    onUpdate: 'CASCADE'
  });
  ClassInfo.hasMany(models.Subject, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
};

module.exports = ClassInfo;
