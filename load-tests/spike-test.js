import { check, group, sleep } from 'k6';
import { config } from './config.js';
import { AuthHelper, APIHelper, randomUser, commonChecks } from './utils.js';

// Spike test - sudden increase in load to test resilience
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Normal load
    { duration: '1m', target: 100 }, // Sudden spike!
    { duration: '30s', target: 5 }, // Back to normal
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    // Very lenient thresholds for spike testing
    http_req_failed: ['rate<0.1'], // Allow up to 10% failures during spike
    http_req_duration: ['p(95)<10000'], // 95% under 10 seconds
    checks: ['rate>0.7'], // 70% success rate
  },
};

const auth = new AuthHelper();
const api = new APIHelper(auth);

export function setup() {
  console.log('Setting up spike test...');
  
  // Pre-authenticate one user of each type
  const authResults = config.testUsers.map(user => {
    const token = auth.login(user.email, user.password);
    return {
      email: user.email,
      role: user.role,
      authenticated: !!token
    };
  });
  
  return { authResults };
}

export default function(data) {
  const user = randomUser();
  const userEmail = user.email;
  
  // Quick authentication check
  if (!auth.getToken(userEmail)) {
    const loginStart = Date.now();
    const token = auth.login(user.email, user.password);
    const loginTime = Date.now() - loginStart;
    
    check(token !== null, {
      'quick login during spike': () => token !== null,
      'login time reasonable during spike': () => loginTime < 5000
    });
  }
  
  if (auth.getToken(userEmail)) {
    group('Spike Load Test', () => {
      // Focus on most critical endpoints during spike
      
      // Health check (should always work)
      const healthResponse = api.get('/health');
      check(healthResponse, {
        'health endpoint survives spike': (r) => r.status === 200,
        'health response fast during spike': (r) => r.timings.duration < 2000
      });
      
      // Primary data endpoints
      const primaryEndpoints = ['/teams', '/projects', '/tasks'];
      const endpoint = primaryEndpoints[Math.floor(Math.random() * primaryEndpoints.length)];
      
      const response = api.get(endpoint, userEmail);
      check(response, {
        [`${endpoint} available during spike`]: (r) => r.status < 500,
        [`${endpoint} responds eventually`]: (r) => r.timings.duration < 30000, // Very generous timeout
        'not completely broken': (r) => r.status !== 503 && r.status !== 502
      });
      
      // Quick operations only during spike
      if (Math.random() < 0.1) { // Only 10% do writes during spike
        const quickTaskData = {
          title: 'Spike Test Task',
          project_id: 'any-project-id' // This will likely fail, but we're testing error handling
        };
        
        const createResponse = api.post('/tasks', quickTaskData, userEmail);
        check(createResponse, {
          'task creation handled during spike': (r) => r.status < 500, // Any response except server error
          'graceful degradation': (r) => r.status === 429 || r.status === 201 || r.status === 400 // Rate limited, success, or validation error
        });
      }
    });
  } else {
    // Track authentication failures during spike
    check(false, {
      'authentication failure during spike': () => false
    });
  }
  
  // Very short sleep during spike to maintain pressure
  sleep(0.1);
}

export function teardown(data) {
  console.log('Spike test completed');
  console.log('Pre-auth results:', JSON.stringify(data.authResults));
}