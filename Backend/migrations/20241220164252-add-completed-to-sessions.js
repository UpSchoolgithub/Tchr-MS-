'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Sessions', 'completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Default: Not completed
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Sessions', 'completed');
  },
};
