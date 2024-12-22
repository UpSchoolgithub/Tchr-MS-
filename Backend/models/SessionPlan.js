const { Model, DataTypes } = require('sequelize');

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
        model: 'sessions',
        key: 'id',
      },
    },
    sessionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true, // Null when not ended
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'in-progress', // Default to 'in-progress'
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
