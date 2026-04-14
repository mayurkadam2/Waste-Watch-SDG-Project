const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
