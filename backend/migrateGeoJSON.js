const mongoose = require('mongoose');
require('dotenv').config();

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const properties = await db.collection('properties').find({}).toArray();
    let count = 0;
    
    for (const prop of properties) {
      if (prop.location && typeof prop.location.lat === 'number' && typeof prop.location.lng === 'number') {
        const lat = prop.location.lat;
        const lng = prop.location.lng;
        
        await db.collection('properties').updateOne(
          { _id: prop._id },
          { 
            $set: { 
              location: {
                type: 'Point',
                coordinates: [lng, lat]
              }
            } 
          }
        );
        count++;
      }
    }
    
    console.log(`Successfully migrated ${count} properties to GeoJSON format.`);
    
    // Ensure the index is built
    console.log('Building 2dsphere index...');
    await db.collection('properties').createIndex({ location: '2dsphere' });
    console.log('Index built.');
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
