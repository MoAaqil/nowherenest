const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://nowherenest:nowherenest@cluster0.l5yzqz3.mongodb.net/nowherenest?appName=Cluster0';

async function updateHostsLicenseIds() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const hosts = await User.find({ role: 'owner' });
    console.log(`Found ${hosts.length} hosts.`);

    for (const host of hosts) {
      if (!host.licenseId) {
        const generatedLicenseId = `NWN-HOST-${Math.floor(100000 + Math.random() * 900000)}`;
        host.licenseId = generatedLicenseId;
        await host.save();
        console.log(`Updated host ${host.email} with generated unique ID: ${generatedLicenseId}`);
      } else {
        console.log(`Host ${host.email} already has license ID: ${host.licenseId}`);
      }
    }

    console.log('Hosts updated successfully!');
  } catch (err) {
    console.error('Error updating hosts:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected!');
  }
}

updateHostsLicenseIds();
