import request from 'supertest';
import { app } from '../src/server';
import { Parent } from '../src/models/Parent';
import { Child } from '../src/models/Child';
import { Device } from '../src/models/Device';

describe('Authentication & Authorization Tests', () => {
  const testParent = {
    fullName: 'Test Parent',
    email: 'testparent@example.com',
    password: 'Password123!',
  };
  
  let authToken: string;
  let parentId: string;
  let childId: string;

  beforeAll(async () => {
    await Parent.deleteMany({});
    await Child.deleteMany({});
    await Device.deleteMany({});
  });

  describe('Auth API Matrix', () => {
    it('should successfully register a new parent', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testParent);
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.email).toBe(testParent.email);
    });

    it('should fail registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad@example.com' });
        
      expect(res.status).toBe(500); // Mongoose ValidationError caught globally as 500
      expect(res.body.success).toBe(false);
    });

    it('should login an existing parent', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testParent.email, password: testParent.password });
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      
      authToken = res.body.data.token;
      parentId = res.body.data._id;
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testParent.email, password: 'WrongPassword1!' });
        
      expect(res.status).toBe(401);
    });
  });

  describe('Authorization API Matrix', () => {
    it('should allow fetching own profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testParent.email);
    });

    it('should block fetching profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
        
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    
    it('should create a child successfully for Parent A', async () => {
      const res = await request(app)
        .post('/api/children')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Child', dateOfBirth: '2015-01-01' });
        
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      childId = res.body.data._id;
    });

    it('should allow fetching own children', async () => {
      const res = await request(app)
        .get('/api/children')
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id).toBe(childId);
    });
  });

  describe('IDOR Prevention (Parent B accessing Parent A data)', () => {
    let parentBToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Parent B',
          email: 'parentb@example.com',
          password: 'Password123!'
        });
      parentBToken = res.body.data.token;
    });

    it('should block Parent B from fetching Parent A child', async () => {
      const res = await request(app)
        .get(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${parentBToken}`);
        
      // Controller checks parentId: req.user._id, so child shouldn't be found. 
      // It returns 404 since it's "Not Found" in Parent B's context.
      expect(res.status).toBe(404); 
    });

    it('should block Parent B from updating Parent A child', async () => {
      const res = await request(app)
        .put(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${parentBToken}`)
        .send({ name: 'Hacked Child' });
        
      expect(res.status).toBe(404); 
    });
    
    it('should block Parent B from deleting Parent A child', async () => {
      const res = await request(app)
        .delete(`/api/children/${childId}`)
        .set('Authorization', `Bearer ${parentBToken}`);
        
      expect(res.status).toBe(404); 
    });
  });
});
