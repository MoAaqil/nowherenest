const Vibe = require('../models/Vibe');
const Property = require('../models/Property');
const http = require('http');
const https = require('https');
const urlModule = require('url');

// Helper to resolve redirect URLs server-side (following HTTP redirects)
const resolveUrl = (targetUrl) => {
  return new Promise((resolve) => {
    try {
      const parsed = urlModule.parse(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      
      const req = client.request({
        method: 'HEAD',
        hostname: parsed.hostname,
        path: parsed.path,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect recursively
          resolve(resolveUrl(urlModule.resolve(targetUrl, res.headers.location)));
        } else {
          resolve(targetUrl);
        }
      });
      
      req.on('error', () => resolve(targetUrl));
      req.end();
    } catch (e) {
      resolve(targetUrl);
    }
  });
};

// Fetch all vibes (reels)
exports.getVibes = async (req, res) => {
  try {
    const vibes = await Vibe.find()
      .populate('owner', 'name email profileImage')
      .populate('property', 'name address starRating photos type')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: vibes.length, vibes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new vibe (Only for owners/hosts)
exports.createVibe = async (req, res) => {
  try {
    const { propertyId, videoUrl, caption, title } = req.body;

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only hosts or admins can publish vibes' });
    }

    if (!propertyId || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Property ID and video URL are required' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (req.user.role === 'owner' && property.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only publish vibes for your own properties' });
    }

    // Resolve short redirects (e.g. pin.it)
    let resolvedUrl = videoUrl.trim();
    if (resolvedUrl.includes('pin.it') || resolvedUrl.includes('youtu.be') || resolvedUrl.includes('bit.ly') || resolvedUrl.includes('tinyurl.com')) {
      resolvedUrl = await resolveUrl(resolvedUrl);
    }

    const vibe = await Vibe.create({
      owner: req.user.id,
      property: propertyId,
      videoUrl: resolvedUrl,
      title: title || '',
      caption: caption || ''
    });

    res.status(201).json({ success: true, message: 'Vibe published successfully', vibe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle like for a vibe
exports.toggleLikeVibe = async (req, res) => {
  try {
    const vibe = await Vibe.findById(req.params.id);
    if (!vibe) {
      return res.status(404).json({ success: false, message: 'Vibe not found' });
    }

    const userId = req.user.id;
    const isLiked = vibe.likes.includes(userId);

    if (isLiked) {
      // Unlike
      vibe.likes = vibe.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      vibe.likes.push(userId);
    }

    await vibe.save();
    res.status(200).json({ success: true, liked: !isLiked, likesCount: vibe.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a vibe campaign
exports.deleteVibe = async (req, res) => {
  try {
    const vibe = await Vibe.findById(req.params.id);
    if (!vibe) {
      return res.status(404).json({ success: false, message: 'Vibe campaign not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && vibe.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this vibe campaign' });
    }

    await vibe.deleteOne();
    res.status(200).json({ success: true, message: 'Vibe campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
