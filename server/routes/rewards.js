const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/rewards — Give reward to student (admin or system)
router.post('/', authenticate, async (req, res) => {
  try {
    const { studentId, activity, points } = req.body;

    if (!studentId || !activity || !points) {
      return res.status(400).json({ error: 'Student ID, activity, and points are required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    const reward = await Reward.create({
      student: studentId,
      activity,
      points: Number(points),
      givenBy: req.user._id
    });

    // Update student's total points
    student.rewardPoints = (student.rewardPoints || 0) + Number(points);
    await student.save();

    const populated = await reward.populate('student', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create reward error:', err);
    res.status(500).json({ error: 'Failed to create reward' });
  }
});

// GET /api/rewards — List rewards (filter by studentId)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};

    // Students see only their own rewards
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (req.query.studentId) {
      filter.student = req.query.studentId;
    }

    const rewards = await Reward.find(filter)
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

module.exports = router;
