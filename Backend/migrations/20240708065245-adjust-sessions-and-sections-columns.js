'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Sessions', 'sectionId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    // Ensure that the 'sections' table's 'id' column is properly defined, but do not redefine the primary key
    await queryInterface.changeColumn('sections', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if necessary
    await queryInterface.changeColumn('Sessions', 'sectionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('sections', 'id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      autoIncrement: false,
    });
  }
};
