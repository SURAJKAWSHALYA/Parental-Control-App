import mongoose from 'mongoose';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));


beforeAll(async () => {
  // Use a dedicated test database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parental_control_test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
