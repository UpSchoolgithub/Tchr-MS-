const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Session extends Model {
  static associate(models) {
    this.belongsTo(models.School, {
      foreignKey: 'schoolId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.belongsTo(models.Section, {
      foreignKey: 'sectionId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.belongsTo(models.Subject, {
      foreignKey: 'subjectId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.belongsTo(models.ClassInfo, {
      foreignKey: 'classInfoId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.belongsTo(models.TimetableEntry, {
      foreignKey: 'timetableEntryId',
      as: 'TimetableEntry',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.belongsTo(models.Teacher, {
      foreignKey: 'teacherId',
      as: 'Teacher',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    this.hasOne(models.SessionPlan, {
      foreignKey: 'sessionId',
      as: 'SessionPlan',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    unitName: {
      type: DataTypes.STRING,
      allowNull: true,
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
    timetableEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'timetable_entries',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending', // Default to 'pending'
    },   
    
  },
  {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    timestamps: true,
  }
);

module.exports = Session;
