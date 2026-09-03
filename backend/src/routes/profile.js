const express = require('express');
const { Submission, Scene } = require('../models');
const { authenticate } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

// GET /profile/me — user profile + stats
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;

    const [avgResult, highResult, totalCount] = await Promise.all([
      Submission.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avg_score']],
        where: { user_id: user.id, status: 'completed' },
      }),
      Submission.findOne({
        attributes: [[sequelize.fn('MAX', sequelize.col('score')), 'highest_score']],
        where: { user_id: user.id, status: 'completed' },
      }),
      Submission.count({ where: { user_id: user.id, status: 'completed' } }),
    ]);

    res.json({
      success: true,
      data: {
        user: {
          user_name: user.username,
          email: user.email,
          is_admin: user.is_admin,
        },
        stats: {
          avg_score: parseFloat(avgResult?.dataValues?.avg_score || 0).toFixed(1),
          highest_score: highResult?.dataValues?.highest_score ?? 0,
          current_streak: user.curr_streak ?? 0,
          longest_streak: user.longest_streak ?? 0,
          total_completed: totalCount,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// GET /profile/history — paginated submission history
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Submission.findAndCountAll({
      where: { user_id: req.user.id, status: 'completed' },
      include: [{ model: Scene, attributes: ['id', 'title', 'publish_date', 'youtube_url'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows.map(sub => ({
        submission_id: sub.id,
        date: sub.createdAt,
        score: sub.score,
        scene_title: sub.Scene?.title,
        video_url: sub.Scene?.youtube_url,
        publish_date: sub.Scene?.publish_date,
      })),
      meta: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// GET /profile/history/:id — detailed result of a past submission
router.get('/history/:id', authenticate, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      where: { id: req.params.id, user_id: req.user.id, status: 'completed' },
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
          video_url:        submission.Scene.youtube_url,
          description:      submission.Scene.description,
          additional_notes: submission.Scene.additional_notes,
          title:            submission.Scene.title,
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
