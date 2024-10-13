// models/ClassInfo.js
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
  sections: {
    type: DataTypes.JSON, // JSON column to store sections and their subjects
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'ClassInfo',
  tableName: 'classinfos',
  timestamps: true,
});

// Update associations
ClassInfo.associate = (models) => {
  // Associate ClassInfo with School
  ClassInfo.belongsTo(models.School, {
    foreignKey: 'schoolId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // No direct association with Section as it's stored as JSON
};

module.exports = ClassInfo;
