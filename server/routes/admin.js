const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/admin/dashboard — Aggregated statistics
router.get('/dashboard', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [total, pending, progress, done, students, collectors] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'collector' })
    ]);

    res.json({ total, pending, progress, done, students, collectors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
