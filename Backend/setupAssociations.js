// setupAssociations.js
const db = require('./models');

// Define associations manually
db.School.hasMany(db.Event, { foreignKey: 'schoolId' });
db.Event.belongsTo(db.School, { foreignKey: 'schoolId' });

db.School.hasMany(db.Class, { foreignKey: 'schoolId' });
db.Class.belongsTo(db.School, { foreignKey: 'schoolId' });

console.log('Associations set up successfully.');

// Verify associations
console.log(Object.keys(db.School.associations)); // Should include 'Events' and 'Classes'
console.log(Object.keys(db.Event.associations)); // Should include 'School'
console.log(Object.keys(db.Class.associations)); // Should include 'School'
