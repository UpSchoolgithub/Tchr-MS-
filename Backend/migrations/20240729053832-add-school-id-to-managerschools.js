'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('managerschools');
      console.log('Table Description:', tableDescription);
      if (!tableDescription.schoolId && !tableDescription.SchoolId) {
        await queryInterface.addColumn('managerschools', 'schoolId', {
          type: Sequelize.INTEGER,
          references: {
            model: 'schools',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      } else {
        console.log('Column schoolId already exists.');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('managerschools');
      if (tableDescription.schoolId || tableDescription.SchoolId) {
        await queryInterface.removeColumn('managerschools', 'schoolId');
      }
    } catch (error) {
      console.error('Error during rollback:', error);
      throw error;
    }
  },
};
