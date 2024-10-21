const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class Teacher extends Model {
  static associate(models) {
    this.belongsTo(models.Manager, { foreignKey: 'ManagerId' });
    this.belongsToMany(models.School, { through: 'TeacherSchools', foreignKey: 'teacherId' }); // Many-to-many association
    this.hasMany(models.TimetableEntry, { foreignKey: 'teacherId' }); // One-to-many association with TimetableEntry
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
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ManagerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'managers',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Teacher',
  tableName: 'teachers',
  timestamps: true,
});

module.exports = Teacher;
