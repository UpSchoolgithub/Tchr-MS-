const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct

class Manager extends Model {
  static associate(models) {
    this.belongsToMany(models.School, { through: 'ManagerSchools' });
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
