const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users/me — Current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user.toJSON());
});

// PUT /api/users/me — Update own profile (avatar, name, dept)
router.put('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['name', 'dept', 'avatar'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json(user.toJSON());
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/users/me/password — Change own password (student/collector)
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/users — List all users (admin only)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id — Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users — Create user (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, dept } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      dept: dept || ''
    });

    res.status(201).json(user.toJSON());
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// DELETE /api/users/:id — Delete user (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
