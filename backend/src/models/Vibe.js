const mongoose = require('mongoose');

const vibeSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  property: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Property', 
    required: true,
    index: true
  },
  videoUrl: { type: String, required: true },
  title: { type: String, default: '' },
  caption: { type: String, default: '' },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vibe', vibeSchema);
