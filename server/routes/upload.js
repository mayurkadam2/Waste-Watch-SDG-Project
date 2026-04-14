const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// POST /api/upload — Upload image to Cloudinary, returns URL
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const folder = req.body.folder || 'wastewatch';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
