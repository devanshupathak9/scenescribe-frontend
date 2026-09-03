const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vocabulary = sequelize.define('Vocabulary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scene_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  word: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  example: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  part_of_speech: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Vocabulary;
