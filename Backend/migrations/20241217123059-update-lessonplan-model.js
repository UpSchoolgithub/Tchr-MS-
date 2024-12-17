module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LessonPlans', 'conceptId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Concepts', // Table name in the database
        key: 'id',
      },
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('LessonPlans', 'conceptId');
  },
};
