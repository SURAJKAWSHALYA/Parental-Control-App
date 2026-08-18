import mongoose from 'mongoose';
import { PairingCode } from '../models/PairingCode';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1/parental_control');
  const code = await PairingCode.findOne({ usedAt: null }).sort({ createdAt: -1 });
  console.log('CODE:', code?.code);
  process.exit(0);
}
run();
