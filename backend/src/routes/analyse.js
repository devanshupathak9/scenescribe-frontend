const express = require('express');
const { authenticate } = require('../middleware/auth');
const { analyseSentence } = require('../services/sentenceAnalysis');
const { Submission, Scene, Vocabulary, Grammar } = require('../models');

const router = express.Router();

// POST /analyse/sentence
// Body: { sentence, submission_id }
// Looks up the submission's scene for full context, calls GPT-4o, persists results.
router.post('/sentence', authenticate, async (req, res) => {
  try {
    const { sentence, submission_id } = req.body;

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'sentence is required and must be a non-empty string' },
      });
    }

    if (sentence.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'sentence must be 2000 characters or fewer' },
      });
    }

    if (!submission_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'submission_id is required' },
      });
    }

    // Load submission + its scene (with vocab and grammar for full context)
    const submission = await Submission.findOne({
      where: { id: submission_id, user_id: req.user.id },
      include: [{
        model: Scene,
        include: [
          { model: Vocabulary, as: 'vocabularies' },
          { model: Grammar,    as: 'grammars' },
        ],
      }],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' },
      });
    }

    const scene = submission.Scene;

    // Pass all scene data so GPT-4o has maximum context
    const result = await analyseSentence({
      title:                 scene.title,
      student_response:      sentence.trim(),
      reference_description: scene.description      || null,
      additional_notes:      scene.additional_notes || null,
      difficulty:            scene.difficulty       || 'intermediate',
      vocabularies:          scene.vocabularies     || [],
      grammars:              scene.grammars         || [],
    });

    // Persist results to the submission row
    await submission.update({
      score:                result.overall_score,
      grammar_score:        result.grammar_score,
      vocabulary_score:     result.vocabulary_score,
      clarity_score:        result.clarity_score,
      feedback: {
        issues:      result.issues      || [],
        suggestions: result.suggestions || [],
      },
      ai_response:          result.improved_sentence || null,
      improved_ai_response: result.improved_sentence || null,
      ideal_sentence:       result.ideal_sentence    || null,
      status: 'completed',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Sentence analysis error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to analyse sentence' },
    });
  }
});

module.exports = router;
