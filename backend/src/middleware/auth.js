const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const User = require('../models/User');

const FIREBASE_PROJECT_ID = 'nowhere-nest';

// Configure JWKS client to fetch Google public certificates dynamically
const jwksClient = jwksRsa({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Helper to retrieve public key corresponding to JWT 'kid' header
const getGooglePublicKey = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route, token missing' });
  }

  try {
    // 1. Try decoding with local JWT secret first (for backward compatibility with seeded accounts)
    try {
      const decodedLocal = jwt.verify(token, process.env.JWT_SECRET || 'nowherenest_secret_key_12345');
      req.user = await User.findById(decodedLocal.id).select('-password');
      if (req.user) {
        return next();
      }
    } catch (err) {
      // Local check failed, proceed to verify as a Firebase Auth ID Token
    }

    // 2. Decode JWT header to extract key ID (kid) for signature verification
    const decodedTokenHeader = jwt.decode(token, { complete: true });
    if (!decodedTokenHeader || !decodedTokenHeader.header.kid) {
      return res.status(401).json({ success: false, message: 'Invalid token signature structure' });
    }

    // 3. Verify Firebase ID Token claims and signatures
    jwt.verify(
      token,
      getGooglePublicKey,
      {
        algorithms: ['RS256'],
        audience: FIREBASE_PROJECT_ID,
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
      },
      async (err, decodedFirebase) => {
        if (err) {
          return res.status(401).json({ success: false, message: `Token validation failed: ${err.message}` });
        }

        // 4. Extract claims and find or register the user in MongoDB
        const { email, phone_number, name, email_verified } = decodedFirebase;
        const fallbackEmail = email || `${decodedFirebase.sub}@firebase.nowherenest.com`;

        let user = await User.findOne({ email: fallbackEmail });

        if (!user) {
          // Auto register new Firebase user in MongoDB database
          console.log(`Auto registering Firebase user in MongoDB: ${fallbackEmail}`);
          user = await User.create({
            name: name || email?.split('@')[0] || 'Firebase User',
            email: fallbackEmail,
            password: Math.random().toString(36).slice(-10), // mock random password for safety
            phone: phone_number || '',
            role: 'customer', // default role
            isVerified: email_verified || false
          });
        } else {
          // Sync changes if any (like email verification status or phone)
          let updated = false;
          if (email_verified && !user.isVerified) {
            user.isVerified = true;
            updated = true;
          }
          if (phone_number && !user.phone) {
            user.phone = phone_number;
            updated = true;
          }
          if (updated) {
            await user.save();
          }
        }

        req.user = user;
        next();
      }
    );

  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authorization check encountered an error' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
