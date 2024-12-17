const Sequelize = require('sequelize');
const sequelize = require('../config/db');

// Import models explicitly
const SessionPlan = require('./SessionPlan');
const Topic = require('./Topic');
const Concept = require('./concept');
const LessonPlan = require('./LessonPlan');

// Initialize the database object
const db = {};

// Attach models to the db object
db.SessionPlan = SessionPlan;
db.Topic = Topic;
db.Concept = Concept;
db.LessonPlan = LessonPlan;

// Set up model associations
SessionPlan.associate = (models) => {
  SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', as: 'Topics' });
};

Topic.associate = (models) => {
  Topic.belongsTo(models.SessionPlan, { foreignKey: 'sessionPlanId', as: 'SessionPlan' });
  Topic.hasMany(models.Concept, { foreignKey: 'topicId', as: 'Concepts', onDelete: 'CASCADE' });
};

Concept.associate = (models) => {
  Concept.belongsTo(models.Topic, { foreignKey: 'topicId', as: 'Topic' });
  Concept.hasOne(models.LessonPlan, { foreignKey: 'conceptId', as: 'LessonPlan' });
};

LessonPlan.associate = (models) => {
  LessonPlan.belongsTo(models.Concept, { foreignKey: 'conceptId', as: 'Concept' });
};

// Assign Sequelize instance to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
