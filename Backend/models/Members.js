const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Member extends Model {}

Member.init({
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
    unique: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schools',
      key: 'id',
    }
  }
}, {
  sequelize,
  modelName: 'Member',
  timestamps: true,
});

module.exports = Member;
