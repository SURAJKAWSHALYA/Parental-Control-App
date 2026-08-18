import mongoose from 'mongoose';
import { PairingCode } from '../models/PairingCode';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1/parental_control');
  const code = await PairingCode.create({
    code: '654321',
    parentId: '6a8356ee9e252bd2cbb29808',
    childId: '6a83eca147e8db77685ce254',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });
  console.log('Pairing code created:', code.code);
  process.exit(0);
}
run();
