const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class SuperManagerUser extends Model {}

SuperManagerUser.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'SuperManagerUser',
});

module.exports = SuperManagerUser;
