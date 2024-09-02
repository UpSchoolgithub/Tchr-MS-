// models/Period.js
module.exports = (sequelize, DataTypes) => {
    const Period = sequelize.define('Period', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      schoolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      periodNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
    }, {
      tableName: 'Periods',
      timestamps: false,
    });
  
    Period.associate = (models) => {
      Period.belongsTo(models.School, { foreignKey: 'schoolId' });
    };
  
    return Period;
  };
  