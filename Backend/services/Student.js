const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Section = require('./Section');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  section_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Section,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent_email: {
    type: DataTypes.STRING,
  },
  parent_phone: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Student;
