// models/Session.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Session extends Model {}

Session.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subjects',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  chapterName: {  // Adding the chapterName field here
    type: DataTypes.STRING,
    allowNull: true,  // Set to true if chapterName can be null
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

// Define associations
Session.associate = (models) => {
  Session.belongsTo(models.Section, { foreignKey: 'sectionId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Session.belongsTo(models.Subject, { foreignKey: 'subjectId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
};

module.exports = Session;
