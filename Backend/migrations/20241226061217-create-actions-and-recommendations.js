module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ActionsAndRecommendations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sessionPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SessionPlans',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('pre-learning', 'post-learning'),
        allowNull: false,
      },
      topicName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      conceptName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ActionsAndRecommendations');
  },
};
