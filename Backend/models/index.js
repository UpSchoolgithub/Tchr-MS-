const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct
const basename = path.basename(__filename);
const db = {};

// Import each model class
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Debug loaded models
console.log('Loaded models:', Object.keys(db));

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db);
  } else {
    console.warn(`No associations defined for model: ${modelName}`);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
