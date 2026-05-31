const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware for backend sanity check
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Import route files
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const roomRoutes = require('./routes/roomRoutes');
const housekeepingRoutes = require('./routes/housekeepingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const staffRoutes = require('./routes/staffRoutes');
const vibeRoutes = require('./routes/vibeRoutes');

// Map Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/vibes', vibeRoutes);

// Route to resolve Pinterest and Google Drive URLs to raw image URLs
app.get('/api/utils/resolve-image', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
    let targetUrl = url.trim();

    // 1. Handle Google Drive links
    const googleDriveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const googleDriveQueryRegex = /[?&]id=([a-zA-Z0-9_-]+)/;
    
    let driveMatch = targetUrl.match(googleDriveRegex) || targetUrl.match(googleDriveQueryRegex);
    if (driveMatch) {
      const fileId = driveMatch[1];
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      return res.status(200).json({ success: true, originalUrl: url, resolvedUrl: directUrl });
    }

    // 2. Handle Pinterest links
    if (targetUrl.includes('pin.it') || targetUrl.includes('pinterest.com')) {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });

      const html = await response.text();
      
      const ogImageRegex = /<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i;
      const ogImageRegexAlt = /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i;
      const twitterImageRegex = /<meta[^>]*(?:property|name)=["']twitter:image[^"']*["'][^>]*content=["']([^"']+)["']/i;
      const twitterImageRegexAlt = /<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image[^"']/i;
      
      let imageMatch = html.match(ogImageRegex) || html.match(ogImageRegexAlt) || html.match(twitterImageRegex) || html.match(twitterImageRegexAlt);
      if (imageMatch && imageMatch[1]) {
        let resolvedUrl = imageMatch[1];
        resolvedUrl = resolvedUrl.replace(/&amp;/g, '&');
        return res.status(200).json({ success: true, originalUrl: url, resolvedUrl });
      }
    }

    return res.status(200).json({ success: true, originalUrl: url, resolvedUrl: url });
  } catch (error) {
    console.error('Failed to resolve image URL:', error);
    return res.status(200).json({ success: true, originalUrl: url, resolvedUrl: url });
  }
});

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Welcome to the Nowhere Nest API Server!' 
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
