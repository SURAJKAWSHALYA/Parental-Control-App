import mongoose from 'mongoose';
import { LocationRecord } from '../../src/models/LocationRecord';
import { Parent } from '../../src/models/Parent';
import { Child } from '../../src/models/Child';
import { Device } from '../../src/models/Device';

const SEED_COUNT = 10000;

async function runLargeDatasetTest() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parental_control_test';
  await mongoose.connect(mongoUri);

  console.log(`Connected to test DB. Seeding ${SEED_COUNT} location records...`);
  
  await Parent.deleteMany({});
  await Child.deleteMany({});
  await Device.deleteMany({});
  await LocationRecord.deleteMany({});

  const parent = await Parent.create({
    fullName: 'Speed Test', email: 'speed@test.com', passwordHash: 'hash'
  });
  
  const child = await Child.create({
    parentId: parent._id, name: 'Speed Child', dateOfBirth: new Date()
  });

  const device = await Device.create({
    childId: child._id, deviceName: 'Speed Device', os: 'android', deviceIdentifier: 'TEST-123', androidVersion: '14', deviceModel: 'Pixel 8', manufacturer: 'Google', appVersion: '1.0.0'
  });

  const records = [];
  for (let i = 0; i < SEED_COUNT; i++) {
    records.push({
      childId: child._id,
      deviceId: device._id,
      latitude: 40.7128 + (Math.random() * 0.1),
      longitude: -74.0060 + (Math.random() * 0.1),
      accuracy: 10,
      timestamp: new Date(Date.now() - i * 60000)
    });
  }

  const startSeed = Date.now();
  await LocationRecord.insertMany(records);
  console.log(`Seeded ${SEED_COUNT} records in ${Date.now() - startSeed}ms`);

  // Test pagination latency
  const startQuery = Date.now();
  const page1 = await LocationRecord.find({ deviceId: device._id })
    .sort({ timestamp: -1 })
    .skip(0)
    .limit(100);
  console.log(`Queried page 1 (100 records) in ${Date.now() - startQuery}ms`);

  const startCount = Date.now();
  const count = await LocationRecord.countDocuments({ deviceId: device._id });
  console.log(`Counted ${count} documents in ${Date.now() - startCount}ms`);

  await mongoose.connection.close();
}

runLargeDatasetTest().catch(console.error);
