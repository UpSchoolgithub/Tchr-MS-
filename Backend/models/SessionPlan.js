const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class SessionPlan extends Model {
  static associate(models) {
    SessionPlan.hasMany(models.Topic, { foreignKey: 'sessionPlanId', as: 'Topics', onDelete: 'CASCADE' });
    SessionPlan.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'Session' });
  }
}

SessionPlan.init(
  {
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sessions', // References the 'sessions' table
        key: 'id',
      },
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Default to false
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SessionPlan',
    tableName: 'SessionPlans',
    freezeTableName: true,
  }
);

module.exports = SessionPlan;
