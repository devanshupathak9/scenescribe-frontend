const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  scene_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  response_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  input_type: {
    type: DataTypes.ENUM('keyboard', 'microphone'),
    defaultValue: 'keyboard',
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  grammar_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  vocabulary_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  clarity_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  feedback: {
    type: DataTypes.JSONB,
    allowNull: true,
    // Structure: { issues: string[], suggestions: string[] }
  },
  ai_response: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Corrected version of the user's sentence
  },
  improved_ai_response: {
    type: DataTypes.TEXT,
    allowNull: true,
    // AI-improved rewrite of the user's sentence
  },
  ideal_sentence: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Best possible description based on the admin reference
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
});

module.exports = Submission;
