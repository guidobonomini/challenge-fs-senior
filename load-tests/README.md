# Load Testing Suite

This directory contains comprehensive load tests for the Task Management Platform using k6.

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/
2. Ensure the backend is running on `http://localhost:8000`
3. Ensure test users exist in the database (from seed data)

## Test Types

### 1. Smoke Test
**Purpose**: Basic functionality verification with minimal load
```bash
npm run test:smoke
```
- 1 virtual user for 30 seconds
- Tests basic API endpoints
- Validates authentication flow

### 2. Load Test  
**Purpose**: Normal expected load simulation
```bash
npm run test:load
```
- Gradually increases from 5 to 10 users
- Simulates realistic user behavior
- 5 minute sustained load test

### 3. Stress Test
**Purpose**: Above-normal load to find performance boundaries
```bash
npm run test:stress
```
- Up to 30 concurrent users
- 10 minute duration
- Tests system resilience under high load

### 4. Spike Test
**Purpose**: Sudden load spikes to test auto-scaling and error handling
```bash
npm run test:spike
```
- Sudden jump from 5 to 100 users
- Tests system recovery
- Validates graceful degradation

### 5. Breakpoint Test
**Purpose**: Find the absolute breaking point of the system
```bash
npm run test:breakpoint
```
- Gradually increases load until system fails
- Identifies maximum capacity
- No VU limit - finds true ceiling

## Test Configuration

Edit `config.js` to modify:
- Base URL and API endpoints
- Test user credentials  
- Performance thresholds
- Rate limiting parameters

## Performance Thresholds

Default thresholds:
- HTTP errors < 1%
- 95% of requests < 2 seconds
- Average response time < 500ms
- Check success rate > 90%

## Test Scenarios

Each test simulates realistic user behavior:

1. **Authentication**: Login with test credentials
2. **Dashboard Access**: View teams, projects, tasks
3. **Task Operations**: Create, list, filter tasks  
4. **Team Operations**: View team details, manage members
5. **Search Operations**: Search across entities

## Monitoring

Tests include built-in monitoring for:
- Response times (avg, p95, p99)
- Error rates by endpoint
- Authentication success rates
- Resource utilization patterns
- Graceful degradation detection

## Results Analysis

After running tests:
1. Check console output for real-time metrics
2. Review HTML reports (if configured)
3. Analyze failure patterns
4. Identify performance bottlenecks

## Environment Variables

- `BASE_URL`: Backend URL (default: http://localhost:8000)
- `K6_WEB_DASHBOARD`: Enable web dashboard
- `K6_WEB_DASHBOARD_EXPORT`: Export dashboard data

## Best Practices

1. **Run tests in isolation**: Don't run multiple test types simultaneously
2. **Monitor system resources**: Watch CPU, memory, database connections
3. **Test with realistic data**: Use production-like data volumes
4. **Validate after changes**: Re-run tests after performance optimizations
5. **Set up CI/CD integration**: Include load tests in deployment pipeline

## Troubleshooting

**High error rates**: 
- Check database connection limits
- Verify rate limiting configuration
- Review server resource allocation

**Slow response times**:
- Analyze database query performance
- Check for N+1 queries
- Review caching strategy

**Authentication failures**:
- Verify test user credentials
- Check JWT token expiration
- Review session management

## Integration with CI/CD

Add to your pipeline:
```yaml
- name: Load Tests
  run: |
    cd load-tests
    npm install
    npm run test:smoke
    npm run test:load
```

Fail the build if thresholds are not met to ensure performance regressions are caught early.