'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Sessions', 'sectionId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('sections', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if necessary
  }
};
