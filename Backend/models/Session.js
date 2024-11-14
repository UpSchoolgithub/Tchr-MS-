const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const SessionPlan = require('./SessionPlan'); // Import SessionPlan model

class Session extends Model {}

Session.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  chapterName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sessionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections',
      key: 'id',
    },
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id',
    },
  },
  numberOfSessions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priorityNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  classInfoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'classinfos',
      key: 'id',
    },
  },
  teacherId: { 
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'teachers', 
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true,
});

Session.associate = (models) => {
  Session.belongsTo(models.School, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
  Session.belongsTo(models.Section, { foreignKey: 'sectionId', onDelete: 'CASCADE' });
  Session.belongsTo(models.Subject, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
  Session.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Session.belongsTo(models.Teacher, { foreignKey: 'teacherId', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  Session.hasOne(models.SessionPlan, { foreignKey: 'sessionId', as: 'SessionPlan' });
};

module.exports = Session;
