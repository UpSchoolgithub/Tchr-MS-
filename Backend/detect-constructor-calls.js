const fs = require('fs');
const path = require('path');
const readline = require('readline');

const directoryPath = path.join(__dirname, 'models'); // Adjust this path if necessary

const checkFileForConstructorCalls = (filePath) => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      // Check for patterns where a constructor might be called without 'new'
      const regex = /(require\(.+\)\(.*\))/;
      if (regex.test(line)) {
        console.log(`Possible constructor call without 'new' found in file ${filePath}:`);
        console.log(line);
      }
    });

    rl.on('close', () => {
      resolve();
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
};

const scanDirectory = async (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      await scanDirectory(filePath);
    } else if (filePath.endsWith('.js')) {
      await checkFileForConstructorCalls(filePath);
    }
  }
};

scanDirectory(directoryPath)
  .then(() => {
    console.log('Scan completed.');
  })
  .catch((error) => {
    console.error('Error during scan:', error);
  });
