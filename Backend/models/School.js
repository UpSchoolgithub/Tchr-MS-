const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct

class School extends Model {
  static associate(models) {
    this.belongsToMany(models.Manager, { through: 'ManagerSchools' });
    this.belongsToMany(models.Teacher, { through: 'TeacherSchools' });
  }
}

School.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'School',
  tableName: 'schools',
  timestamps: true,
});

module.exports = School;
