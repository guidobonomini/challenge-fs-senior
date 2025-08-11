import { check, group, sleep } from 'k6';
import { config } from './config.js';
import { AuthHelper, APIHelper, randomUser } from './utils.js';

// Breakpoint test - gradually increase load until system breaks
export const options = {
  executor: 'ramping-arrival-rate',
  stages: [
    { duration: '2m', target: 10 }, // Start with 10 req/s
    { duration: '2m', target: 20 }, // 20 req/s
    { duration: '2m', target: 50 }, // 50 req/s
    { duration: '2m', target: 100 }, // 100 req/s
    { duration: '2m', target: 200 }, // 200 req/s
    { duration: '2m', target: 300 }, // 300 req/s - likely breaking point
    { duration: '2m', target: 400 }, // 400 req/s - definitely breaking
  ],
  preAllocatedVUs: 10,
  maxVUs: 500,
  thresholds: {
    // No strict thresholds - we want to find the breaking point
    http_req_failed: ['rate<0.5'], // Allow up to 50% failures
    http_req_duration: ['p(95)<30000'], // Very generous timeout
  },
};

const auth = new AuthHelper();
const api = new APIHelper(auth);

let breakpointFound = false;
let lastWorkingRPS = 0;

export function setup() {
  console.log('Setting up breakpoint test - finding system limits...');
  
  // Pre-authenticate users
  const results = config.testUsers.map(user => {
    const token = auth.login(user.email, user.password);
    return { email: user.email, success: !!token };
  });
  
  return { setupResults: results };
}

export default function(data) {
  const user = randomUser();
  const userEmail = user.email;
  
  // Ensure authentication
  if (!auth.getToken(userEmail)) {
    auth.login(user.email, user.password);
  }
  
  group('Breakpoint Detection', () => {
    const startTime = Date.now();
    
    // Test critical path - most important functionality
    const response = api.get('/tasks', userEmail);
    const responseTime = Date.now() - startTime;
    
    const success = check(response, {
      'system still responsive': (r) => r.status === 200,
      'acceptable response time': (r) => r.timings.duration < 5000,
      'not server error': (r) => r.status < 500,
      'not gateway timeout': (r) => r.status !== 504,
      'not service unavailable': (r) => r.status !== 503
    });
    
    // Track performance degradation
    check(response, {
      'under 1 second': (r) => r.timings.duration < 1000,
      'under 2 seconds': (r) => r.timings.duration < 2000,
      'under 5 seconds': (r) => r.timings.duration < 5000,
      'under 10 seconds': (r) => r.timings.duration < 10000,
    });
    
    // Memory/resource pressure indicators
    if (response.status === 429) {
      check(true, { 'rate limiting active': () => true });
    }
    
    if (response.status === 503) {
      check(true, { 'service overloaded': () => true });
      breakpointFound = true;
    }
    
    if (response.status >= 500) {
      check(true, { 'server errors occurring': () => true });
    }
    
    // Log current state periodically
    if (__ITER % 100 === 0) {
      console.log(`Iteration ${__ITER}: Status ${response.status}, Response time: ${response.timings.duration}ms`);
    }
  });
  
  // No sleep - maintain maximum pressure
}

export function teardown(data) {
  console.log('Breakpoint test completed');
  console.log('Setup results:', JSON.stringify(data.setupResults));
  
  if (breakpointFound) {
    console.log('⚠️ System breakpoint was reached during test');
  } else {
    console.log('✅ System handled all load levels successfully');
  }
}