const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nowherenest';
    console.log(`Connecting to MongoDB... Target URI: ${connStr}`);
    
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // fail fast if db is not running
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('\n======================================================');
    console.warn('WARNING: Failed to connect to MongoDB database.');
    console.warn('Please ensure that:');
    console.warn('1. MongoDB is installed and running locally on your machine, OR');
    console.warn('2. You have configured a valid MONGODB_URI in backend/.env');
    console.warn('   (e.g., using a free cluster from MongoDB Atlas)');
    console.warn('======================================================\n');
    // We do not exit the process here to let frontend connect and show informative DB alerts.
  }
};

module.exports = connectDB;
