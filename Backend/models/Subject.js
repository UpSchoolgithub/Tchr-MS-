const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Subject extends Model {}

Subject.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subjectName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'classinfos', // Ensure this matches the exact table name
      key: 'id',
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections', // Ensure this matches the exact table name
      key: 'id',
    },
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools', // Ensure this matches the exact table name
      key: 'id',
    },
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
  modelName: 'Subject',
  tableName: 'subjects',
  timestamps: true, // Automatically manage createdAt and updatedAt fields
});

Subject.associate = (models) => {
  Subject.belongsTo(models.Section, {
    foreignKey: 'sectionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Subject.belongsTo(models.ClassInfo, {
    foreignKey: 'classInfoId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Subject.belongsTo(models.School, {
    foreignKey: 'schoolId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Subject;
