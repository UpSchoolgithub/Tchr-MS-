const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db'); // Sequelize instance from db config

const db = {};
const basename = path.basename(__filename);

// Read all model files in the directory
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && // Ignore hidden files
      file !== basename && // Ignore this index.js file
      file.slice(-3) === '.js' // Only include .js files
    );
  })
  .forEach((file) => {
    // Import and initialize models
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Call associate method for all models if defined
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Pass all models for association
  }
});

// Assign Sequelize instance to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
