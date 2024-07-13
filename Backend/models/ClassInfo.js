const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed
const Subject = require('./Subject');

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
  hooks: {
    afterCreate: async (classInfo, options) => {
      try {
        await Subject.create({
          subjectName: classInfo.subject,
          classInfoId: classInfo.id,
          sectionId: classInfo.section,
          schoolId: classInfo.schoolId
        });
        console.log(`Subject created for classInfo ID: ${classInfo.id}`);
      } catch (error) {
        console.error('Error creating subject:', error.message);
      }
    }
  }
});

module.exports = ClassInfo;
