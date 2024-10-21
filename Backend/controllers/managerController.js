const { Manager } = require('../models'); // Assuming Sequelize models are in the models directory

const fetchSchoolsForManager = async (managerId) => {
  try {
    // Fetch the manager with the associated schools
    const manager = await Manager.findByPk(managerId, {
      include: {
        model: School,  // This assumes you have a belongsToMany association between Manager and School
        through: { attributes: [] },  // Omit the join table data
      }
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
