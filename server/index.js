const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Serve static frontend ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// ── Catch-all: serve index.html for frontend routes ────────────────
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Connect MongoDB & start server ─────────────────────────────────
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 WasteWatch server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
