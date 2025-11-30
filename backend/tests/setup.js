// Test setup file
require('dotenv').config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testHelpers = {
  // Helper to create test user
  createTestUser: async (User, userData) => {
    const user = new User(userData);
    await user.save();
    return user;
  },

  // Helper to clean up test data
  cleanup: async (...models) => {
    for (const model of models) {
      await model.deleteMany({});
    }
  }
};

