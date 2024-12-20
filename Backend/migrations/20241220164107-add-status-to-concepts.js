'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Concepts', 'status', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Incomplete by default
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Concepts', 'status');
  },
};
