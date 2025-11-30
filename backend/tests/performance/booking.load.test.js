/**
 * TC-PERF-002: Booking service response time under peak load
 * 
 * This test simulates 300 concurrent booking requests
 * Expected: Average response time < 1 second, 95th percentile < 2 seconds, Error rate < 1%
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/user.model');
const Class = require('../../models/class.model');

// Test configuration
const CONCURRENT_USERS = 300;
const TARGET_AVG_RESPONSE_TIME = 1000; // ms
const TARGET_95TH_PERCENTILE = 2000; // ms
const MAX_ERROR_RATE = 1; // percent

describe('TC-PERF-002: Booking Service Performance Test', () => {
  let studentToken;
  let classId;
  let studentIds = [];

  beforeAll(async () => {
    // Create multiple test students
    const studentPromises = Array.from({ length: 10 }, (_, i) => {
      return User.create({
        username: `perfstudent${i}`,
        email: `perfstudent${i}@test.com`,
        password: 'Test123!',
        role: 'student',
        fullName: `Performance Student ${i}`,
        isEmailVerified: true,
        isActive: true
      });
    });

    const students = await Promise.all(studentPromises);
    studentIds = students.map(s => s._id);

    // Login as first student to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'perfstudent0@test.com',
        password: 'Test123!'
      });
    studentToken = loginRes.body.token;

    // Create a test class with high capacity
    const testTutor = await User.findOne({ role: 'tutor' }) || 
                      await User.create({
                        username: 'perftutor',
                        email: 'perftutor@test.com',
                        password: 'Test123!',
                        role: 'tutor',
                        fullName: 'Performance Tutor',
                        isEmailVerified: true,
                        isActive: true
                      });

    const testClass = await Class.create({
      name: 'Performance Test Class',
      tutorId: testTutor._id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      maxCapacity: 500, // High capacity for load testing
      students: [],
      isCancelled: false
    });
    classId = testClass._id;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: /perfstudent\d@test\.com/ });
    await User.deleteMany({ email: 'perftutor@test.com' });
    await Class.deleteMany({ name: 'Performance Test Class' });
  });

  test('should handle 300 concurrent booking requests with acceptable performance', async () => {
    const startTime = Date.now();
    const results = [];

    // Create requests with staggered execution to simulate real load
    const requests = Array.from({ length: CONCURRENT_USERS }, async (_, i) => {
      // Use different student tokens (rotate through available students)
      const studentIndex = i % 10;
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: `perfstudent${studentIndex}@test.com`,
          password: 'Test123!'
        });
      
      const token = loginRes.body.token;

      // Make booking request
      const requestStart = Date.now();
      try {
        const response = await request(app)
          .post('/api/booking/book')
          .set('Authorization', `Bearer ${token}`)
          .send({
            classId: classId
          });

        const requestTime = Date.now() - requestStart;
        results.push({
          status: response.status,
          responseTime: requestTime,
          success: response.status === 201 || response.status === 200
        });
      } catch (error) {
        results.push({
          status: 500,
          responseTime: Date.now() - requestStart,
          success: false,
          error: error.message
        });
      }
    });

    // Execute requests (not truly concurrent due to async nature, but simulates load)
    await Promise.all(requests);

    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    const errorRate = (failedRequests / CONCURRENT_USERS) * 100;

    // Calculate statistics
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const percentile95 = responseTimes[Math.floor(responseTimes.length * 0.95)];

    console.log('\n📊 Booking Performance Test Results:');
    console.log(`   Total Requests: ${CONCURRENT_USERS}`);
    console.log(`   Successful: ${successfulRequests}`);
    console.log(`   Failed: ${failedRequests}`);
    console.log(`   Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${percentile95}ms`);
    console.log(`   Target Average: < ${TARGET_AVG_RESPONSE_TIME}ms`);
    console.log(`   Target 95th Percentile: < ${TARGET_95TH_PERCENTILE}ms`);

    // Assertions
    expect(errorRate).toBeLessThan(MAX_ERROR_RATE);
    expect(avgResponseTime).toBeLessThan(TARGET_AVG_RESPONSE_TIME);
    expect(percentile95).toBeLessThan(TARGET_95TH_PERCENTILE);
  });
});

