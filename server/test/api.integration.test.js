import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/blood_bank_api_test';
process.env.JWT_SECRET = 'integration-test-secret';

let app;
let donorToken;
let recipientToken;
let adminToken;
let hospitalId;
let requestId;

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const account = userType => ({
  username: `${userType}-${suffix}`,
  email: `${userType}-${suffix}@example.test`,
  phoneNumber: '9999999999',
  address: 'API integration test',
  userType,
  password: 'TestPass123!',
  passwordConfirm: 'TestPass123!'
});

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  ({ app } = await import('../src/app.js'));
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('public health and inventory APIs respond', async () => {
  assert.equal((await request(app).get('/api/health')).status, 200);
  const inventory = await request(app).get('/api/public/inventory');
  assert.equal(inventory.status, 200);
  assert.ok(Array.isArray(inventory.body.inventory));
});

test('signup creates donor, recipient and administrator sessions', async () => {
  const donor = await request(app).post('/api/auth/signup').send(account('donor'));
  const recipient = await request(app).post('/api/auth/signup').send(account('recipient'));
  const admin = await request(app).post('/api/auth/signup').send(account('admin'));
  assert.equal(donor.status, 201);
  assert.equal(recipient.status, 201);
  assert.equal(admin.status, 201);
  donorToken = donor.body.token;
  recipientToken = recipient.body.token;
  adminToken = admin.body.token;
});

test('login, current-user and authentication errors respond correctly', async () => {
  const login = await request(app).post('/api/auth/login').send({ username: account('donor').username, password: account('donor').password });
  assert.equal(login.status, 200);
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`)).status, 200);
  assert.equal((await request(app).post('/api/auth/login').send({ username: account('donor').username, password: 'wrong' })).status, 401);
});

test('role dashboards and permission checks respond correctly', async () => {
  for (const token of [donorToken, recipientToken, adminToken]) {
    assert.equal((await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`)).status, 200);
  }
  assert.equal((await request(app).get('/api/admin/hospitals').set('Authorization', `Bearer ${donorToken}`)).status, 403);
});

test('administrator hospital create, list, update and delete APIs respond', async () => {
  const hospital = {
    name: `API Test Hospital ${suffix}`,
    address: 'Test City',
    mainDoctor: 'Dr. Test',
    contactNumber: '8888888888',
    email: `hospital-${suffix}@example.test`,
    mainDomain: 'Emergency Medicine'
  };
  const created = await request(app).post('/api/admin/hospitals').set('Authorization', `Bearer ${adminToken}`).send(hospital);
  assert.equal(created.status, 201);
  hospitalId = created.body.hospital._id;
  assert.equal((await request(app).get('/api/hospitals').set('Authorization', `Bearer ${recipientToken}`)).status, 200);
  assert.equal((await request(app).get('/api/admin/hospitals').set('Authorization', `Bearer ${adminToken}`)).status, 200);
  assert.equal((await request(app).put(`/api/admin/hospitals/${hospitalId}`).set('Authorization', `Bearer ${adminToken}`).send({ ...hospital, mainDoctor: 'Dr. Updated' })).status, 200);

  const disposable = await request(app).post('/api/admin/hospitals').set('Authorization', `Bearer ${adminToken}`).send({ ...hospital, name: `${hospital.name} Disposable`, email: `disposable-${suffix}@example.test` });
  assert.equal((await request(app).delete(`/api/admin/hospitals/${disposable.body.hospital._id}`).set('Authorization', `Bearer ${adminToken}`)).status, 200);
});

test('donation and recipient request workflows respond', async () => {
  const donation = await request(app).post('/api/donations').set('Authorization', `Bearer ${donorToken}`).send({
    bloodGroup: 'B+',
    medicalCheckupDate: new Date().toISOString().slice(0, 10),
    eligibility: { healthy: true, age: true, weight: true, medication: true, infection: true }
  });
  assert.equal(donation.status, 201);
  assert.equal((await request(app).post('/api/donations').set('Authorization', `Bearer ${recipientToken}`).send({})).status, 403);

  const bloodRequest = await request(app).post('/api/requests').set('Authorization', `Bearer ${recipientToken}`).send({ bloodGroup: 'B+', hospital: hospitalId, unitsRequired: 1, urgencyLevel: 'high' });
  assert.equal(bloodRequest.status, 201);
  requestId = bloodRequest.body.request._id;
});

test('administrator request listing, matching and status APIs respond', async () => {
  const list = await request(app).get('/api/admin/requests').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(list.status, 200);
  assert.ok(list.body.requests.some(item => item._id === requestId));
  assert.equal((await request(app).get(`/api/admin/requests/${requestId}/matches`).set('Authorization', `Bearer ${adminToken}`)).status, 200);
  assert.equal((await request(app).patch(`/api/admin/requests/${requestId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'approved' })).status, 200);
  assert.equal((await request(app).patch(`/api/admin/requests/${requestId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'completed' })).status, 200);
  assert.equal((await request(app).delete(`/api/admin/hospitals/${hospitalId}`).set('Authorization', `Bearer ${adminToken}`)).status, 409);
});
