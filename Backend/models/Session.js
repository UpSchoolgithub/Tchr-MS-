const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

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
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: true,
});

// Define the associations in the associate method
Session.associate = (models) => {
  Session.belongsTo(models.School, { foreignKey: 'schoolId', onDelete: 'CASCADE' });
  Session.belongsTo(models.Section, { foreignKey: 'sectionId', onDelete: 'CASCADE' });
  Session.belongsTo(models.Subject, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
  Session.belongsTo(models.ClassInfo, { foreignKey: 'classId', onDelete: 'CASCADE' });

};

module.exports = Session;
