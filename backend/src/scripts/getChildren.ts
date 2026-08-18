import mongoose from 'mongoose';
import { Child } from '../models/Child';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1/parental_control');
  const children = await Child.find();
  console.log('Children:', children.map(c => ({ id: c._id, name: c.name, parentId: c.parentId })));
  process.exit(0);
}
run();
