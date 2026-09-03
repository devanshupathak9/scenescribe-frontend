const express = require('express');
const { Scene, Vocabulary, Grammar, Submission, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { analyseSentence } = require('../services/sentenceAnalysis');

const router = express.Router();

// GET /dashboard/today — fetch all of today's scenes, each with the user's submission status
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const scenes = await Scene.findAll({
      where: { publish_date: today },
      order: [['scene_order', 'ASC'], ['createdAt', 'ASC']],
      include: [
        { model: Vocabulary, as: 'vocabularies' },
        { model: Grammar, as: 'grammars' },
      ],
    });

    if (!scenes.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_SCENE', message: 'No scene available for today' },
      });
    }

    const submissions = await Submission.findAll({
      where: {
        user_id: req.user.id,
        scene_id: scenes.map(s => s.id),
        status: 'completed',
      },
    });
    const submissionMap = new Map(submissions.map(s => [s.scene_id, s]));

    const result = scenes.map(scene => {
      const sub = submissionMap.get(scene.id);
      const video = {
        video_id:        scene.id,
        video_url:       scene.youtube_url,
        title:           scene.title,
        description:     scene.description,
        additional_notes: scene.additional_notes,
        difficulty:      scene.difficulty,
        vocabularies:    scene.vocabularies,
        grammars:        scene.grammars,
      };
      if (!sub) return { status: 'pending', video };
      return {
        status: 'submitted',
        video,
        submission: {
          submission_id:        sub.id,
          response_text:        sub.response_text,
          input_type:           sub.input_type,
          score:                sub.score,
          breakdown: {
            grammar:    sub.grammar_score,
            vocabulary: sub.vocabulary_score,
            clarity:    sub.clarity_score,
          },
          feedback:             sub.feedback || { issues: [], suggestions: [] },
          improved_ai_response: sub.improved_ai_response || null,
          ideal_sentence:       sub.ideal_sentence       || null,
        },
      };
    });

    return res.json({ success: true, data: { scenes: result } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// POST /dashboard/submit — submit description and get AI feedback
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { video_id, response_text, input_type } = req.body;

    if (!video_id || !response_text || response_text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'video_id and response_text (min 10 chars) are required' },
      });
    }

    const scene = await Scene.findByPk(video_id, {
      include: [
        { model: Vocabulary, as: 'vocabularies' },
        { model: Grammar, as: 'grammars' },
      ],
    });
    if (!scene) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENE_NOT_FOUND', message: 'Scene not found' },
      });
    }

    const existing = await Submission.findOne({
      where: { user_id: req.user.id, scene_id: video_id, status: 'completed' },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_SUBMITTED', message: 'You have already submitted for this scene.' },
      });
    }

    const submission = await Submission.create({
      user_id: req.user.id,
      scene_id: video_id,
      response_text: response_text.trim(),
      input_type: input_type === 'microphone' ? 'microphone' : 'keyboard',
      status: 'processing',
    });

    // Build AI feedback via GPT-4o (fallback is handled inside analyseSentence)
    const feedback = await analyseSentence({
      title:                 scene.title,
      student_response:      response_text.trim(),
      reference_description: scene.description      || null,
      additional_notes:      scene.additional_notes || null,
      difficulty:            scene.difficulty       || 'intermediate',
      vocabularies:          scene.vocabularies     || [],
      grammars:              scene.grammars         || [],
    });

    await submission.update({
      score:             feedback.overall_score,
      grammar_score:     feedback.grammar_score,
      vocabulary_score:  feedback.vocabulary_score,
      clarity_score:     feedback.clarity_score,
      feedback: {
        issues:      feedback.issues      || [],
        suggestions: feedback.suggestions || [],
      },
      ai_response:          feedback.improved_sentence || null,
      improved_ai_response: feedback.improved_sentence || null,
      ideal_sentence:       feedback.ideal_sentence    || null,
      status: 'completed',
    });

    // Update user streak + stats
    const user = req.user;
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = user.curr_streak;
    if (user.last_submission_date === yesterday) {
      newStreak = user.curr_streak + 1;
    } else if (user.last_submission_date !== today) {
      newStreak = 1;
    }

    await user.update({
      curr_streak:          newStreak,
      longest_streak:       Math.max(user.longest_streak, newStreak),
      total_completed:      (user.total_completed || 0) + 1,
      last_submission_date: today,
    });

    res.json({
      success: true,
      data: {
        submission_id: submission.id,
        score:    feedback.overall_score,
        breakdown: {
          grammar:    feedback.grammar_score,
          vocabulary: feedback.vocabulary_score,
          clarity:    feedback.clarity_score,
        },
        input_type: submission.input_type,
        feedback: {
          issues:      feedback.issues      || [],
          suggestions: feedback.suggestions || [],
        },
        ai_response:          feedback.improved_sentence || null,
        improved_ai_response: feedback.improved_sentence || null,
        ideal_sentence:       feedback.ideal_sentence    || null,
        new_streak: newStreak,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error processing submission' } });
  }
});

// GET /dashboard/result/:submissionId — get a specific submission result
router.get('/result/:submissionId', authenticate, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      where: { id: req.params.submissionId, user_id: req.user.id, status: 'completed' },
      include: [{ model: Scene, attributes: ['id', 'title', 'youtube_url', 'description', 'additional_notes'] }],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' },
      });
    }

    res.json({
      success: true,
      data: {
        submission_id: submission.id,
        video: {
          video_url:       submission.Scene.youtube_url,
          description:     submission.Scene.description,
          additional_notes: submission.Scene.additional_notes,
          title:           submission.Scene.title,
        },
        response_text: submission.response_text,
        input_type:    submission.input_type,
        score:         submission.score,
        breakdown: {
          grammar:    submission.grammar_score,
          vocabulary: submission.vocabulary_score,
          clarity:    submission.clarity_score,
        },
        feedback:             submission.feedback || { issues: [], suggestions: [] },
        ai_response:          submission.ai_response          || null,
        improved_ai_response: submission.improved_ai_response || null,
        ideal_sentence:       submission.ideal_sentence       || null,
        date: submission.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

module.exports = router;
