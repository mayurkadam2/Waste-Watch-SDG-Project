const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

// Helper: generate next complaint ID
async function nextComplaintId() {
  const count = await Complaint.countDocuments();
  return 'WMS-' + String(count + 1).padStart(4, '0');
}

// POST /api/complaints — Create complaint
router.post('/', authenticate, async (req, res) => {
  try {
    const { location, wasteType, description, photoUrl, type } = req.body;

    if (!location || !wasteType || !description) {
      return res.status(400).json({ error: 'Location, waste type, and description are required' });
    }

    const complaint = await Complaint.create({
      complaintId: await nextComplaintId(),
      reporter: req.user._id,
      location,
      wasteType,
      description,
      photoUrl: photoUrl || null,
      type: type || 'complaint'
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// GET /api/complaints — List complaints with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.reporterId) filter.reporter = req.query.reporterId;
    if (req.query.assignedCollectorId) filter.assignedCollector = req.query.assignedCollectorId;

    // Students can only see their own complaints
    if (req.user.role === 'student') {
      filter.reporter = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('reporter', 'name email')
      .populate('assignedCollector', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET /api/complaints/:id — Get single complaint
router.get('/:id', authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
      .populate('reporter', 'name email')
      .populate('assignedCollector', 'name email');

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// PUT /api/complaints/:id — Update status, assign collector, add proof
router.put('/:id', authenticate, requireRole('collector', 'admin'), async (req, res) => {
  try {
    const { status, proofPhotoUrl, assignedCollectorId } = req.body;
    const update = {};

    if (status) update.status = status;
    if (proofPhotoUrl) update.proofPhotoUrl = proofPhotoUrl;
    if (assignedCollectorId) update.assignedCollector = assignedCollectorId;

    // Auto-assign collector who updates it
    if (req.user.role === 'collector' && !update.assignedCollector) {
      update.assignedCollector = req.user._id;
    }

    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.id },
      update,
      { new: true }
    ).populate('reporter', 'name email')
     .populate('assignedCollector', 'name email');

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    console.error('Update complaint error:', err);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

module.exports = router;
