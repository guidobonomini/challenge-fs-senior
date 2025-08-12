// Configuration for load tests
export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:8000',
  apiPath: '/api',
  
  // Test users
  testUsers: [
    {
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin'
    },
    {
      email: 'manager@demo.com',
      password: 'password123', 
      role: 'manager'
    },
    {
      email: 'user@demo.com',
      password: 'password123',
      role: 'member'
    }
  ],
  
  // Performance thresholds
  thresholds: {
    // HTTP errors should be less than 1%
    http_req_failed: ['rate<0.01'],
    // 95% of requests should complete within 2 seconds and average < 500ms
    http_req_duration: ['p(95)<2000', 'avg<500'],
    // Check success rate
    checks: ['rate>0.9'],
  },
  
  // Rate limiting
  rateLimits: {
    rps: 10, // requests per second
    rpm: 600 // requests per minute
  }
};

export default config;