const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grammar = sequelize.define('Grammar', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scene_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  pattern: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  example: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Grammar;
