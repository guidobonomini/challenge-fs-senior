import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

// Authentication utility
export class AuthHelper {
  constructor() {
    this.tokens = new Map();
  }
  
  login(email, password) {
    const loginData = {
      email: email,
      password: password
    };
    
    const response = http.post(
      `${config.baseUrl}${config.apiPath}/auth/login`,
      JSON.stringify(loginData),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const isValid = check(response, {
      'login successful': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      }
    });
    
    if (isValid && response.status === 200) {
      const body = JSON.parse(response.body);
      this.tokens.set(email, body.token);
      return body.token;
    }
    
    return null;
  }
  
  getToken(email) {
    return this.tokens.get(email);
  }
  
  getAuthHeaders(email) {
    const token = this.getToken(email);
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }
}

// API request helpers
export class APIHelper {
  constructor(authHelper) {
    this.auth = authHelper;
  }
  
  get(endpoint, email = null) {
    const headers = email ? this.auth.getAuthHeaders(email) : {
      'Content-Type': 'application/json'
    };
    
    return http.get(`${config.baseUrl}${config.apiPath}${endpoint}`, {
      headers: headers
    });
  }
  
  post(endpoint, data, email = null) {
    const headers = email ? this.auth.getAuthHeaders(email) : {
      'Content-Type': 'application/json'
    };
    
    return http.post(
      `${config.baseUrl}${config.apiPath}${endpoint}`,
      JSON.stringify(data),
      { headers: headers }
    );
  }
  
  put(endpoint, data, email = null) {
    const headers = email ? this.auth.getAuthHeaders(email) : {
      'Content-Type': 'application/json'
    };
    
    return http.put(
      `${config.baseUrl}${config.apiPath}${endpoint}`,
      JSON.stringify(data),
      { headers: headers }
    );
  }
  
  del(endpoint, email = null) {
    const headers = email ? this.auth.getAuthHeaders(email) : {
      'Content-Type': 'application/json'
    };
    
    return http.del(`${config.baseUrl}${config.apiPath}${endpoint}`, null, {
      headers: headers
    });
  }
}

// Performance utilities
export function randomUser() {
  const users = config.testUsers;
  return users[Math.floor(Math.random() * users.length)];
}

export function randomDelay(min = 1, max = 5) {
  const delay = Math.random() * (max - min) + min;
  sleep(delay);
}

export function generateTestData() {
  const taskTitles = [
    'Fix critical bug in authentication',
    'Implement user dashboard',
    'Add file upload functionality', 
    'Optimize database queries',
    'Update UI components',
    'Write API documentation',
    'Set up monitoring',
    'Configure deployment pipeline'
  ];
  
  const descriptions = [
    'This is an important task that needs attention',
    'Please review and implement as soon as possible',
    'Low priority task for future sprint',
    'Critical issue affecting production users'
  ];
  
  return {
    title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    type: ['task', 'bug', 'feature'][Math.floor(Math.random() * 3)]
  };
}

export const commonChecks = {
  'status is 200': (r) => r.status === 200,
  'status is not 404': (r) => r.status !== 404,
  'status is not 500': (r) => r.status !== 500,
  'response time OK': (r) => r.timings.duration < 2000,
  'response has body': (r) => r.body.length > 0,
};