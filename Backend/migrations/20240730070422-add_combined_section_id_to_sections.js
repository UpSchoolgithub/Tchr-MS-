'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sections', 'combinedSectionId', {
      type: Sequelize.STRING,
      allowNull: true, // This can be changed to false if it should always be provided
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sections', 'combinedSectionId');
  }
};
