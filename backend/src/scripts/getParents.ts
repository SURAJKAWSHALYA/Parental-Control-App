import mongoose from 'mongoose';
import { Parent } from '../models/Parent';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1/parental_control');
  const parents = await Parent.find();
  console.log('Parents:', parents.map(p => ({ id: p._id, email: p.email })));
  process.exit(0);
}
run();
