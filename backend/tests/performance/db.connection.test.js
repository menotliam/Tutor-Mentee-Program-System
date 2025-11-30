/**
 * TC-PERF-003: Database connection pool under load
 * 
 * This test simulates sustained load for 10 minutes and monitors DB connections
 * Expected: No connection pool exhaustion, connections properly released
 */

const mongoose = require('mongoose');
const { connectDB } = require('../../config/db');
const User = require('../../models/user.model');
const Class = require('../../models/class.model');
const Booking = require('../../models/booking.model');

// Test configuration
const TEST_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const REQUESTS_PER_SECOND = 10;
const TOTAL_REQUESTS = (TEST_DURATION_MS / 1000) * REQUESTS_PER_SECOND;

describe('TC-PERF-003: Database Connection Pool Test', () => {
  let initialConnectionCount;
  let maxConnectionCount = 0;
  let connectionLeaks = 0;

  beforeAll(async () => {
    await connectDB();
    
    // Get initial connection count
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    initialConnectionCount = serverStatus.connections?.current || 0;
    
    console.log(`📊 Initial DB Connections: ${initialConnectionCount}`);
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /dbloadtest\d@test\.com/ });
    await Class.deleteMany({ name: /DB Load Test/ });
    await Booking.deleteMany({});
  });

  test('should handle sustained load without connection pool exhaustion', async () => {
    const startTime = Date.now();
    const requestInterval = 1000 / REQUESTS_PER_SECOND; // ms between requests
    const requests = [];
    let requestCount = 0;

    // Monitor connection count periodically
    const monitorInterval = setInterval(async () => {
      try {
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();
        const currentConnections = serverStatus.connections?.current || 0;
        
        if (currentConnections > maxConnectionCount) {
          maxConnectionCount = currentConnections;
        }

        // Check for connection leaks (connections not being released)
        if (currentConnections > initialConnectionCount + 10) {
          connectionLeaks++;
        }
      } catch (error) {
        console.error('Error monitoring connections:', error);
      }
    }, 5000); // Check every 5 seconds

    // Simulate sustained load with database operations
    const simulateLoad = async () => {
      while (Date.now() - startTime < TEST_DURATION_MS) {
        try {
          // Perform various DB operations
          const operations = [
            // Read operations
            User.findOne({ email: 'student1@test.com' }),
            Class.find({ isCancelled: false }),
            Booking.countDocuments({ status: 'ACTIVE' }),
            
            // Write operations (create and delete test data)
            User.create({
              username: `dbloadtest${requestCount}`,
              email: `dbloadtest${requestCount}@test.com`,
              password: 'Test123!',
              role: 'student',
              isEmailVerified: true,
              isActive: true
            }).then(user => {
              // Clean up immediately
              return User.deleteOne({ _id: user._id });
            }),
          ];

          await Promise.all(operations);
          requestCount++;

          // Wait before next batch
          await new Promise(resolve => setTimeout(resolve, requestInterval));
        } catch (error) {
          console.error(`Request ${requestCount} failed:`, error.message);
        }
      }
    };

    // Run load simulation
    await simulateLoad();

    // Stop monitoring
    clearInterval(monitorInterval);

    const totalTime = Date.now() - startTime;

    // Final connection check
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    const finalConnectionCount = serverStatus.connections?.current || 0;

    console.log('\n📊 Database Connection Pool Test Results:');
    console.log(`   Test Duration: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    console.log(`   Total Requests: ${requestCount}`);
    console.log(`   Requests/Second: ${(requestCount / (totalTime / 1000)).toFixed(2)}`);
    console.log(`   Initial Connections: ${initialConnectionCount}`);
    console.log(`   Max Connections: ${maxConnectionCount}`);
    console.log(`   Final Connections: ${finalConnectionCount}`);
    console.log(`   Connection Leak Detections: ${connectionLeaks}`);

    // Assertions
    expect(maxConnectionCount).toBeLessThan(initialConnectionCount + 50); // Allow some headroom
    expect(connectionLeaks).toBeLessThan(10); // Very few leaks allowed
    
    // Verify connections are released
    const connectionDiff = finalConnectionCount - initialConnectionCount;
    expect(connectionDiff).toBeLessThan(10); // Connections should be released
  }, 15 * 60 * 1000); // 15 minute timeout for this test
});

