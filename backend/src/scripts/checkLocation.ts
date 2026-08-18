import mongoose from 'mongoose';
import { LocationRecord } from '../models/LocationRecord';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1/parental_control');
  const syncs = await LocationRecord.find().sort({ timestamp: -1 }).limit(5);
  console.log('Recent LocationRecords:', syncs);
  process.exit(0);
}
run();
