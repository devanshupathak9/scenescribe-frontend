const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scene = sequelize.define('Scene', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,  // Admin/reference sentence — used for AI scoring
    allowNull: false,
  },
  youtube_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  additional_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  scene_order: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  publish_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'intermediate',
  },
});

module.exports = Scene;
