const { Manager } = require('../models');  // Adjust the path to your models

const fetchSchoolsForManager = async (managerId) => {
  try {
    // Use Sequelize's association to fetch the manager and their associated schools
    const manager = await Manager.findByPk(managerId, {
      include: {
        model: School,  // Assumes School is correctly associated with Manager
        through: { attributes: [] },  // Exclude the join table from the results
      },
    });

    if (!manager) {
      throw new Error('Manager not found');
    }

    return manager.Schools;  // Return the associated schools
  } catch (error) {
    console.error(`Error fetching schools for managerId ${managerId}:`, error);
    throw new Error('Failed to fetch schools');
  }
};

module.exports = { fetchSchoolsForManager };
