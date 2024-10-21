const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Manager extends Model {
  static associate(models) {
    // Many-to-Many relationship between Manager and School through ManagerSchools join table
    this.belongsToMany(models.School, { through: 'ManagerSchools', foreignKey: 'ManagerId' });
  }
}

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

module.exports = Manager;
