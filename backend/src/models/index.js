const sequelize = require('../config/database');
const User = require('./User');
const Scene = require('./Scene');
const Vocabulary = require('./Vocabulary');
const Grammar = require('./Grammar');
const Submission = require('./Submission');

// Associations
Scene.hasMany(Vocabulary, { foreignKey: 'scene_id', as: 'vocabularies' });
Vocabulary.belongsTo(Scene, { foreignKey: 'scene_id' });

Scene.hasMany(Grammar, { foreignKey: 'scene_id', as: 'grammars' });
Grammar.belongsTo(Scene, { foreignKey: 'scene_id' });

User.hasMany(Submission, { foreignKey: 'user_id', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'user_id' });

Scene.hasMany(Submission, { foreignKey: 'scene_id', as: 'submissions' });
Submission.belongsTo(Scene, { foreignKey: 'scene_id' });

module.exports = { sequelize, User, Scene, Vocabulary, Grammar, Submission };
