const sequelize = require('../config/db');
const School = require('./School');
const ClassInfo = require('./ClassInfo');
const Section = require('./Section');
const Subject = require('./Subject');
const SectionSubject = require('./SectionSubject');
const TimetableSettings = require('./timetableSettings');
const SchoolCalendar = require('./SchoolCalendar');
const Member = require('./Members');
const Holiday = require('./Holiday');
const Session = require('./Session');
const SessionPlan = require('./SessionPlan');
const Manager = require('./Manager');

function initModels() {
  // Associations
  ClassInfo.associate = (models) => {
    ClassInfo.hasMany(models.Section, { foreignKey: 'classInfoId' });
    ClassInfo.belongsTo(models.School, { foreignKey: 'schoolId' });
  };

  Section.associate = (models) => {
    Section.belongsTo(models.ClassInfo, { foreignKey: 'classInfoId' });
    Section.belongsToMany(models.Subject, { through: models.SectionSubject, foreignKey: 'sectionId' });
  };

  Subject.associate = (models) => {
    Subject.belongsToMany(models.Section, { through: models.SectionSubject, foreignKey: 'subjectId' });
  };

  SectionSubject.associate = (models) => {
    // If there are any associations for SectionSubject, define them here
  };

  // Call associate method for each model
  ClassInfo.associate({ Section, School });
  Section.associate({ ClassInfo, Subject });
  Subject.associate({ Section });

  // Export all models
  return {
    sequelize,
    School,
    ClassInfo,
    Section,
    Subject,
    SectionSubject,
    TimetableSettings,
    SchoolCalendar,
    Member,
    Holiday,
    Session,
    SessionPlan,
    Manager,
  };
}

module.exports = initModels;
