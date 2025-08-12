import { check, group, sleep } from 'k6';
import { config } from './config.js';
import { AuthHelper, APIHelper, randomUser, randomDelay, generateTestData, commonChecks } from './utils.js';

// Load test - normal expected load
export const options = {
  stages: [
    { duration: '2m', target: 5 }, // Ramp up to 5 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: config.thresholds,
};

const auth = new AuthHelper();
const api = new APIHelper(auth);

export function setup() {
  console.log('Setting up load test...');
  
  // Pre-authenticate users
  const authenticatedUsers = [];
  for (const user of config.testUsers) {
    const token = auth.login(user.email, user.password);
    if (token) {
      authenticatedUsers.push(user.email);
    }
  }
  
  return { authenticatedUsers };
}

export default function(data) {
  const user = randomUser();
  const userEmail = user.email;
  
  // Ensure user is authenticated
  if (!auth.getToken(userEmail)) {
    auth.login(user.email, user.password);
  }
  
  group('User Session Flow', () => {
    // Simulate realistic user behavior patterns
    
    group('Dashboard Access', () => {
      // Check teams
      const teamsResponse = api.get('/teams', userEmail);
      check(teamsResponse, {
        ...commonChecks,
        'can access teams': (r) => r.status === 200
      });
      
      randomDelay(0.5, 1.5);
      
      // Check projects  
      const projectsResponse = api.get('/projects', userEmail);
      check(projectsResponse, {
        ...commonChecks,
        'can access projects': (r) => r.status === 200
      });
      
      randomDelay(0.5, 1.5);
      
      // Check tasks
      const tasksResponse = api.get('/tasks', userEmail);
      check(tasksResponse, {
        ...commonChecks,
        'can access tasks': (r) => r.status === 200
      });
    });
    
    // Simulate task operations (70% of users)
    if (Math.random() < 0.7) {
      group('Task Operations', () => {
        // Get first project ID for task creation
        const projectsResponse = api.get('/projects?limit=1', userEmail);
        if (projectsResponse.status === 200) {
          const projects = JSON.parse(projectsResponse.body).projects;
          if (projects && projects.length > 0) {
            const projectId = projects[0].id;
            
            // Create a task (30% chance)
            if (Math.random() < 0.3) {
              const taskData = {
                ...generateTestData(),
                project_id: projectId
              };
              
              const createResponse = api.post('/tasks', taskData, userEmail);
              check(createResponse, {
                'can create task': (r) => r.status === 201,
                'create task response time OK': (r) => r.timings.duration < 3000
              });
              
              randomDelay(1, 2);
            }
            
            // List tasks with filters (80% chance)
            if (Math.random() < 0.8) {
              const filters = [
                '',
                '?status=todo',
                '?status=in_progress', 
                '?priority=high',
                '?project_id=' + projectId
              ];
              const filter = filters[Math.floor(Math.random() * filters.length)];
              
              const listResponse = api.get(`/tasks${filter}`, userEmail);
              check(listResponse, {
                'can list tasks': (r) => r.status === 200,
                'list tasks response time OK': (r) => r.timings.duration < 1500
              });
            }
          }
        }
      });
    }
    
    // Simulate team operations (30% of users)
    if (Math.random() < 0.3 && user.role !== 'member') {
      group('Team Operations', () => {
        // Get team details
        const teamsResponse = api.get('/teams?limit=1', userEmail);
        if (teamsResponse.status === 200) {
          const teams = JSON.parse(teamsResponse.body).teams;
          if (teams && teams.length > 0) {
            const teamId = teams[0].id;
            
            const teamDetailResponse = api.get(`/teams/${teamId}`, userEmail);
            check(teamDetailResponse, {
              'can get team details': (r) => r.status === 200,
              'team details response time OK': (r) => r.timings.duration < 1000
            });
          }
        }
      });
    }
    
    randomDelay(2, 5);
  });
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Authenticated users: ${data.authenticatedUsers.length}`);
}