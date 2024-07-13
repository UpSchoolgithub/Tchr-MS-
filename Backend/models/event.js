const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class Event extends Model {}

Event.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  eventName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eventDate: {
    type: DataTypes.DATEONLY,
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
  modelName: 'Event',
  tableName: 'events',
  timestamps: true,
});

module.exports = Event;
