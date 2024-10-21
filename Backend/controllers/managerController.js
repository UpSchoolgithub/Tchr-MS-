const db = require('../db'); // Adjust the path to your database connection file

const fetchSchoolsForManager = async (managerId) => {
  try {
    // Execute the query to fetch schools associated with the given managerId
    const [schools] = await db.query('SELECT * FROM schools WHERE managerId = ?', [managerId]);

    // Return the list of schools (this depends on your DB driver, e.g., MySQL2 returns rows in the first array index)
    return schools;
  } catch (error) {
    console.error(`Error fetching schools for managerId ${managerId}:`, error);
    throw new Error('Failed to fetch schools');
  }
};

module.exports = { fetchSchoolsForManager };
