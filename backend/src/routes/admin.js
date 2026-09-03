const express = require('express');
const { Scene, Vocabulary, Grammar, Submission, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

const MAX_SCENES_PER_DAY = 4;

// POST /admin/schedule — create a scheduled video (up to MAX_SCENES_PER_DAY per date)
router.post('/schedule', async (req, res) => {
  try {
    const {
      date, video_url, title, description,
      additional_notes, is_premium, difficulty,
      scene_order, vocabularies, grammars,
    } = req.body;

    if (!video_url || !date || !title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'date, video_url, title, and description are required' },
      });
    }

    const existingCount = await Scene.count({ where: { publish_date: date } });
    if (existingCount >= MAX_SCENES_PER_DAY) {
      return res.status(409).json({
        success: false,
        error: { code: 'DATE_LIMIT', message: `Maximum ${MAX_SCENES_PER_DAY} scenes per day allowed` },
      });
    }

    const scene = await Scene.create({
      title,
      description,
      youtube_url: video_url,
      additional_notes: additional_notes || null,
      publish_date: date,
      is_premium: is_premium || false,
      difficulty: difficulty || 'intermediate',
      scene_order: scene_order || (existingCount + 1),
    });

    if (Array.isArray(vocabularies)) {
      for (const v of vocabularies) {
        if (v.word && v.definition) {
          await Vocabulary.create({ scene_id: scene.id, ...v });
        }
      }
    }

    if (Array.isArray(grammars)) {
      for (const g of grammars) {
        if (g.pattern && g.explanation) {
          await Grammar.create({ scene_id: scene.id, ...g });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: { video_id: scene.id },
      message: 'Video scheduled successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Server error' } });
  }
});

// GET /admin/schedule — get all scheduled videos
router.get('/schedule', async (req, res) => {
  try {
    const scenes = await Scene.findAll({
      order: [['publish_date', 'ASC']],
      include: [
        { model: Vocabulary, as: 'vocabularies' },
        { model: Grammar, as: 'grammars' },
      ],
    });

    res.json({
      success: true,
      data: scenes.map(s => ({
        video_id:        s.id,
        date:            s.publish_date,
        scene_order:     s.scene_order,
        video_url:       s.youtube_url,
        title:           s.title,
        description:     s.description,
        additional_notes: s.additional_notes,
        is_premium:      s.is_premium || false,
        difficulty:      s.difficulty,
        vocabularies:    s.vocabularies,
        grammars:        s.grammars,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// GET /admin/schedule/:date — get all scenes for a specific date
router.get('/schedule/:date', async (req, res) => {
  try {
    const scenes = await Scene.findAll({
      where: { publish_date: req.params.date },
      order: [['scene_order', 'ASC'], ['createdAt', 'ASC']],
      include: [
        { model: Vocabulary, as: 'vocabularies' },
        { model: Grammar, as: 'grammars' },
      ],
    });

    if (!scenes.length) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No videos scheduled for this date' },
      });
    }

    res.json({
      success: true,
      data: scenes.map(s => ({
        video_id:        s.id,
        date:            s.publish_date,
        scene_order:     s.scene_order,
        video_url:       s.youtube_url,
        title:           s.title,
        description:     s.description,
        additional_notes: s.additional_notes,
        is_premium:      s.is_premium || false,
        difficulty:      s.difficulty,
        vocabularies:    s.vocabularies,
        grammars:        s.grammars,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// PATCH /admin/schedule/:id — update a scheduled video
router.patch('/schedule/:id', async (req, res) => {
  try {
    const scene = await Scene.findByPk(req.params.id);
    if (!scene) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
    }

    const { video_url, title, description, additional_notes, is_premium, difficulty } = req.body;

    await scene.update({
      ...(video_url        !== undefined && { youtube_url: video_url }),
      ...(title            !== undefined && { title }),
      ...(description      !== undefined && { description }),
      ...(additional_notes !== undefined && { additional_notes }),
      ...(is_premium       !== undefined && { is_premium }),
      ...(difficulty       !== undefined && { difficulty }),
    });

    res.json({ success: true, message: 'Video updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// DELETE /admin/schedule/:id — delete a scheduled video
router.delete('/schedule/:id', async (req, res) => {
  try {
    const scene = await Scene.findByPk(req.params.id);
    if (!scene) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scene not found' },
      });
    }
    await scene.destroy();
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

// GET /admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [totalUsers, totalSubmissions, totalScenes, avgResult] = await Promise.all([
      User.count(),
      Submission.count({ where: { status: 'completed' } }),
      Scene.count(),
      Submission.findOne({
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('score')), 'avg_score']],
        where: { status: 'completed' },
      }),
    ]);

    const recentSubmissions = await Submission.findAll({
      where: { status: 'completed' },
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, attributes: ['username'] },
        { model: Scene, attributes: ['title'] },
      ],
    });

    res.json({
      success: true,
      data: {
        total_users:        totalUsers,
        total_submissions:  totalSubmissions,
        total_scenes:       totalScenes,
        average_score:      parseFloat(avgResult?.dataValues?.avg_score || 0).toFixed(1),
        recent_submissions: recentSubmissions.map(s => ({
          id:          s.id,
          username:    s.User?.username,
          scene_title: s.Scene?.title,
          score:       s.score,
          date:        s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } });
  }
});

module.exports = router;
