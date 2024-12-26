'use strict';

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
          model: 'SessionPlans', // Ensure this matches the table name
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sessions', // Ensure this matches the table name
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ActionsAndRecommendations');
  },
};
