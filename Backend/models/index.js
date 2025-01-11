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
    try {
      const model = require(path.join(__dirname, file));
      db[model.name] = model;
      console.log(`[INFO] Model loaded: ${file} -> ${model.name}`);
    } catch (error) {
      console.error(`[ERROR] Failed to load model: ${file}`, error.message);
    }
  });

// Debug loaded models
console.log('[INFO] Loaded models:', Object.keys(db));

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      console.log(`[INFO] Associating model: ${modelName}`);
      db[modelName].associate(db);
    } catch (error) {
      console.error(`[ERROR] Failed to associate model: ${modelName}`, error.message);
    }
  } else {
    console.warn(`[WARNING] No associations defined for model: ${modelName}`);
  }
});

// Add Sequelize and sequelize instance to the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
