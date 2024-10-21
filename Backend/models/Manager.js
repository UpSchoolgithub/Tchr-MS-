const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Manager extends Model {}

Manager.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Manager',
  tableName: 'managers',
  timestamps: true,
});

// Define the associations in the associate method
Manager.associate = (models) => {
  // Many-to-Many relationship between Manager and School via ManagerSchools
  Manager.belongsToMany(models.School, { through: 'managerschools', foreignKey: 'ManagerId' });
};

module.exports = Manager;
