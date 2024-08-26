const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ClassSections extends Model {}

// Initialize the ClassSections model with composite primary key
ClassSections.init({
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classinfos', // This should exactly match the table name in your database
      key: 'id',
    },
    primaryKey: true, // Part of the composite primary key
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections', // This should exactly match the table name in your database
      key: 'id',
    },
    primaryKey: true, // Part of the composite primary key
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'ClassSections',
  tableName: 'ClassSections', // Explicitly set the table name in the database
  timestamps: true, // Automatically manage createdAt and updatedAt fields
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

// Define associations
ClassSections.associate = (models) => {
  ClassSections.belongsTo(models.ClassInfo, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  ClassSections.belongsTo(models.Section, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = ClassSections;
