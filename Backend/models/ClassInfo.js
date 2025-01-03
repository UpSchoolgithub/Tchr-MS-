const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class ClassInfo extends Model {}

ClassInfo.init(
  {
    className: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    board: {
      type: DataTypes.ENUM('ICSE', 'CBSE', 'STATE'), // Enum for board types
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ClassInfo',
    tableName: 'classinfos',
    timestamps: true,
  }
);

ClassInfo.associate = (models) => {
  ClassInfo.belongsTo(models.School, { foreignKey: 'schoolId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  ClassInfo.hasMany(models.Section, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  ClassInfo.hasMany(models.Subject, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  ClassInfo.hasMany(models.Session, { foreignKey: 'classInfoId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
};

module.exports = ClassInfo;
