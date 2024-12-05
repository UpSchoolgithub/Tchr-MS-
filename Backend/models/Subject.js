const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Subject extends Model {}

Subject.init(
  {
    subjectName: {
      type: DataTypes.STRING,
      allowNull: false,
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
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sections',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    classInfoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classinfos',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    board: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['ICSE', 'CBSE', 'STATE']],
      },
    },
  },
  {
    sequelize,
    modelName: 'Subject',
    tableName: 'subjects',
    timestamps: true,
  }
);

Subject.associate = (models) => {
  Subject.belongsTo(models.Section, { foreignKey: 'sectionId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Subject.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Subject.belongsTo(models.School, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
};

module.exports = Subject;
