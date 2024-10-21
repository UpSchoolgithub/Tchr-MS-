const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class School extends Model {}

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

School.associate = (models) => {
  School.hasMany(models.ClassInfo, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  School.hasMany(models.Section, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  School.hasMany(models.Subject, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  School.belongsTo(Manager, { foreignKey: 'managerId' });

};

module.exports = School;
