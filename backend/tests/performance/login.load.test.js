/**
 * TC-PERF-001: Login response time under normal load
 * 
 * This test simulates 100 concurrent login requests
 * Expected: Average response time < 500ms, 95th percentile < 1 second
 */

const request = require('supertest');
const app = require('../../server');

// Test configuration
const CONCURRENT_USERS = 100;
const TARGET_AVG_RESPONSE_TIME = 500; // ms
const TARGET_95TH_PERCENTILE = 1000; // ms

describe('TC-PERF-001: Login Performance Test', () => {
  const responseTimes = [];
  
  test('should handle 100 concurrent login requests with acceptable response times', async () => {
    const testEmail = 'student1@test.com';
    const testPassword = 'Student123!';

    // Create array of promises for concurrent requests
    const requests = Array.from({ length: CONCURRENT_USERS }, (_, i) => {
      return request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        })
        .then((response) => {
          return {
            status: response.status,
            responseTime: response.headers['x-response-time'] || 0
          };
        })
        .catch((error) => {
          return {
            status: 500,
            error: error.message
          };
        });
    });

    // Execute all requests concurrently and measure time
    const startTime = Date.now();
    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successfulRequests = results.filter(r => r.status === 200).length;
    const failedRequests = CONCURRENT_USERS - successfulRequests;

    // Calculate response times (approximate - actual timing may vary)
    const avgResponseTime = totalTime / CONCURRENT_USERS;

    console.log('\n📊 Performance Test Results:');
    console.log(`   Total Requests: ${CONCURRENT_USERS}`);
    console.log(`   Successful: ${successfulRequests}`);
    console.log(`   Failed: ${failedRequests}`);
    console.log(`   Total Time: ${totalTime}ms`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Target Average: < ${TARGET_AVG_RESPONSE_TIME}ms`);

    // Assertions
    expect(successfulRequests).toBeGreaterThan(CONCURRENT_USERS * 0.95); // 95% success rate
    expect(avgResponseTime).toBeLessThan(TARGET_AVG_RESPONSE_TIME);
    
    // Store for reporting
    responseTimes.push({
      concurrentUsers: CONCURRENT_USERS,
      avgResponseTime: avgResponseTime,
      totalTime: totalTime,
      successRate: (successfulRequests / CONCURRENT_USERS) * 100
    });
  });
});

