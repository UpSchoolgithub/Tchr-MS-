const fs = require('fs');
const path = require('path');
const { Model, Sequelize } = require('sequelize');
const sequelize = require('./config/db'); // Adjust the path to your db config file

const modelsDir = path.join(__dirname, 'models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => {
  return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
});

let allModelsClassBased = true;

modelFiles.forEach(file => {
  const modelPath = path.join(modelsDir, file);
  const modelModule = require(modelPath);

  if (!(modelModule.prototype instanceof Model)) {
    console.error(`Model in file ${file} is not class-based.`);
    allModelsClassBased = false;
  } else {
    console.log(`Model in file ${file} is class-based.`);
  }
});

if (allModelsClassBased) {
  console.log('All models are class-based.');
} else {
  console.error('Some models are not class-based.');
}
