const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

fs.readdir(modelsDir, (err, files) => {
  if (err) {
    return console.error('Unable to scan models directory:', err);
  }

  console.log(`Scanning ${files.length} files in models directory...`);

  files.forEach(file => {
    console.log(`Checking file: ${file}`);
    if (file.endsWith('.js') && file !== 'index.js') {
      const filePath = path.join(modelsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`Reading content of file: ${file}`);

      if (!fileContent.includes('module.exports = (sequelize, DataTypes) => {')) {
        console.log(`Model file ${file} does not seem to follow the factory function pattern.`);
      } else {
        console.log(`Model file ${file} follows the factory function pattern.`);
      }
    }
  });

  console.log('Scan completed.');
});
