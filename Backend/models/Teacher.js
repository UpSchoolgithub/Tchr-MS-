const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure this path is correct

class Teacher extends Model {
  static associate(models) {
    this.belongsToMany(models.School, { through: 'TeacherSchools' });
  }
}

Teacher.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Teacher',
  tableName: 'teachers',
  timestamps: true,
});

module.exports = Teacher;
