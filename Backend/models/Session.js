const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { SessionPlan } = require('./SessionPlan'); // or adjust path as needed

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
  teacherId: { // New field for Teacher association
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null if the session is not yet assigned to a teacher
    references: {
      model: 'teachers', // Assuming the model is named `teachers`
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
  Session.belongsTo(models.Teacher, { foreignKey: 'teacherId', onDelete: 'SET NULL', onUpdate: 'CASCADE' }); // Association to Teacher
  Session.hasOne(models.SessionPlan, { foreignKey: 'sessionId', as: 'SessionPlan' });
  SessionPlan.belongsTo(Session, { foreignKey: 'sessionId' });
  
};

module.exports = Session;
