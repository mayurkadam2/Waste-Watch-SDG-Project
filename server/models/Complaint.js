const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  wasteType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  proofPhotoUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['complaint', 'scan'],
    default: 'complaint'
  }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
