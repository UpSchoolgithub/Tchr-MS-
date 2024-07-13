const School = require('./models/School');
console.log('School model:', School);

(async () => {
  try {
    const schools = await School.findAll();
    console.log('Schools:', schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
  }
})();
