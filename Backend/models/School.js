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

// Define the associations in the associate method
School.associate = (models) => {
  // Many-to-Many relationship between School and Manager via ManagerSchools
  School.belongsToMany(models.Manager, { through: 'managerschools', foreignKey: 'SchoolId' });
  School.belongsToMany(models.Teacher, { through: 'teacher_schools', foreignKey: 'schoolId' });

  // Other relationships
  School.hasMany(models.ClassInfo, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  School.hasMany(models.Section, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  School.hasMany(models.Subject, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
};

module.exports = School;
