const mongoose = require('mongoose');

const check = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/nowherenest');
    const db = mongoose.connection.db;
    const vibes = await db.collection('vibes').find().toArray();
    console.log(JSON.stringify(vibes, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
