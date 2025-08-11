import { check, group, sleep } from 'k6';
import { config } from './config.js';
import { AuthHelper, APIHelper, randomUser, commonChecks } from './utils.js';

// Smoke test - basic functionality with minimal load
export const options = {
  vus: 1, // 1 virtual user
  duration: '30s',
  thresholds: config.thresholds,
};

const auth = new AuthHelper();
const api = new APIHelper(auth);

export function setup() {
  // Login test users
  console.log('Setting up smoke test...');
  
  const loginResults = [];
  for (const user of config.testUsers) {
    const token = auth.login(user.email, user.password);
    loginResults.push({
      email: user.email,
      success: !!token
    });
  }
  
  return { loginResults };
}

export default function(data) {
  const user = randomUser();
  
  group('Authentication Flow', () => {
    // Test login
    const loginResponse = auth.login(user.email, user.password);
    check(loginResponse !== null, {
      'user can login': () => loginResponse !== null
    });
  });
  
  if (auth.getToken(user.email)) {
    group('API Endpoints', () => {
      // Test teams endpoint
      const teamsResponse = api.get('/teams', user.email);
      check(teamsResponse, {
        ...commonChecks,
        'teams endpoint works': (r) => r.status === 200
      });
      
      // Test projects endpoint
      const projectsResponse = api.get('/projects', user.email);
      check(projectsResponse, {
        ...commonChecks,
        'projects endpoint works': (r) => r.status === 200
      });
      
      // Test tasks endpoint
      const tasksResponse = api.get('/tasks', user.email);
      check(tasksResponse, {
        ...commonChecks,
        'tasks endpoint works': (r) => r.status === 200
      });
      
      // Test dashboard/health endpoints
      const healthResponse = api.get('/health');
      check(healthResponse, {
        'health endpoint works': (r) => r.status === 200,
        'health response time OK': (r) => r.timings.duration < 1000
      });
    });
  }
  
  sleep(1);
}

export function teardown(data) {
  console.log('Smoke test completed');
  console.log(`Login results: ${JSON.stringify(data.loginResults)}`);
}