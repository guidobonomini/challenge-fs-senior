import { check, group, sleep } from 'k6';
import { config } from './config.js';
import { AuthHelper, APIHelper, randomUser, generateTestData, commonChecks } from './utils.js';

// Stress test - above normal load to find breaking point
export const options = {
  stages: [
    { duration: '5m', target: 10 }, // Ramp up to 10 users
    { duration: '10m', target: 20 }, // Increase to 20 users
    { duration: '5m', target: 30 }, // Peak at 30 users
    { duration: '10m', target: 20 }, // Scale back to 20
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    http_req_failed: ['rate<0.05'], // Allow up to 5% failures
    http_req_duration: ['p(95)<5000'], // 95% under 5 seconds
    http_req_duration_avg: ['avg<2000'], // Average under 2 seconds
    checks: ['rate>0.8'], // 80% success rate
  },
};

const auth = new AuthHelper();
const api = new APIHelper(auth);

export function setup() {
  console.log('Setting up stress test...');
  
  // Pre-authenticate all users
  const results = [];
  for (const user of config.testUsers) {
    const token = auth.login(user.email, user.password);
    results.push({ email: user.email, authenticated: !!token });
  }
  
  return { authResults: results };
}

export default function(data) {
  const user = randomUser();
  const userEmail = user.email;
  
  // Ensure authentication
  if (!auth.getToken(userEmail)) {
    const token = auth.login(user.email, user.password);
    check(token !== null, {
      'authentication successful': () => token !== null
    });
  }
  
  if (auth.getToken(userEmail)) {
    group('High Load Operations', () => {
      // Rapid-fire API requests to stress the system
      
      // Multiple concurrent data fetches
      const endpoints = ['/teams', '/projects', '/tasks'];
      
      for (const endpoint of endpoints) {
        const response = api.get(endpoint, userEmail);
        check(response, {
          [`${endpoint} responds`]: (r) => r.status < 500,
          [`${endpoint} not too slow`]: (r) => r.timings.duration < 10000
        });
        
        // Short sleep to create realistic load
        sleep(0.1);
      }
      
      // Task creation under stress (50% chance)
      if (Math.random() < 0.5) {
        // Get a project first
        const projectsResponse = api.get('/projects?limit=1', userEmail);
        if (projectsResponse.status === 200) {
          try {
            const projects = JSON.parse(projectsResponse.body).projects;
            if (projects && projects.length > 0) {
              const taskData = {
                ...generateTestData(),
                project_id: projects[0].id
              };
              
              const createResponse = api.post('/tasks', taskData, userEmail);
              check(createResponse, {
                'task creation under stress': (r) => r.status === 201 || r.status === 429, // Allow rate limiting
                'creation not server error': (r) => r.status < 500
              });
            }
          } catch (e) {
            // Handle JSON parsing errors gracefully
            console.log('JSON parsing error in stress test');
          }
        }
      }
      
      // Pagination stress test
      if (Math.random() < 0.3) {
        const pageSize = Math.floor(Math.random() * 50) + 1; // 1-50 items per page
        const page = Math.floor(Math.random() * 5) + 1; // Pages 1-5
        
        const paginatedResponse = api.get(`/tasks?limit=${pageSize}&page=${page}`, userEmail);
        check(paginatedResponse, {
          'pagination works under load': (r) => r.status === 200 || r.status === 429,
          'pagination response reasonable': (r) => r.timings.duration < 15000
        });
      }
      
      // Search operations (high CPU usage)
      if (Math.random() < 0.2) {
        const searchTerm = ['bug', 'feature', 'critical', 'urgent'][Math.floor(Math.random() * 4)];
        const searchResponse = api.get(`/tasks?search=${searchTerm}`, userEmail);
        check(searchResponse, {
          'search works under stress': (r) => r.status === 200 || r.status === 429,
          'search not too slow': (r) => r.timings.duration < 20000
        });
      }
    });
  }
  
  // Vary sleep time to create realistic load patterns
  const sleepTime = Math.random() * 3; // 0-3 seconds
  sleep(sleepTime);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log('Authentication results:', JSON.stringify(data.authResults));
}