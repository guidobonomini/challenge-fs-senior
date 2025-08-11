const { Knex } = require('knex');

exports.seed = async function(knex) {
  // Clear existing tasks first
  await knex('tasks').del();

  const tasks = [];

  // Generate 30 sample tasks with varied dates for analytics
  const taskTitles = [
    'Fix user authentication bug in login form',
    'Implement dark theme feature for better user experience',
    'Write API documentation for new endpoints',
    'Add unit tests for payment processing module',
    'Research best practices for React performance',
    'Refactor legacy database queries for better performance',
    'Design new user onboarding flow wireframes',
    'Optimize image loading performance on mobile devices',
    'Create user feedback collection system',
    'Fix memory leak in WebSocket connections',
    'Implement real-time notifications feature',
    'Add drag-and-drop functionality to kanban board',
    'Write technical specification for new feature',
    'Test cross-browser compatibility for IE11',
    'Investigate slow API response times issue',
    'Update third-party dependencies to latest versions',
    'Create responsive design for tablet devices',
    'Fix UI layout issues on small screens',
    'Add keyboard shortcuts for power users',
    'Implement data export functionality',
    'Create automated backup system',
    'Fix database connection timeout errors',
    'Add search functionality to task lists',
    'Design new dashboard layout mockups',
    'Optimize CSS bundle size for faster loading',
    'Implement user role-based permissions',
    'Create integration with external calendar',
    'Fix email notification delivery issues',
    'Add bulk task operations feature',
    'Write end-to-end tests for critical workflows'
  ];

  const taskTypes = ['task', 'bug', 'feature', 'epic'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const statuses = ['todo', 'in_progress', 'in_review', 'done'];
  const users = [
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002', 
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
  ];
  const projects = [
    '880e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440003'
  ];

  // Generate tasks over the past 6 months for good analytics data
  for (let i = 0; i < 30; i++) {
    const createdDate = new Date();
    createdDate.setMonth(createdDate.getMonth() - Math.floor(Math.random() * 6));
    createdDate.setDate(Math.floor(Math.random() * 28) + 1);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const completedDate = status === 'done' ? new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
    const timeSpent = status === 'done' ? Math.floor(Math.random() * 600) + 60 : Math.floor(Math.random() * 300);
    
    // Determine type based on title keywords for better AI categorization testing
    let type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const title = taskTitles[i];
    
    if (title.toLowerCase().includes('bug') || title.toLowerCase().includes('fix') || title.toLowerCase().includes('issue')) {
      type = 'bug';
    } else if (title.toLowerCase().includes('feature') || title.toLowerCase().includes('implement') || title.toLowerCase().includes('add')) {
      type = 'feature';
    } else if (title.toLowerCase().includes('design') || title.toLowerCase().includes('create') || title.toLowerCase().includes('write')) {
      type = 'task';
    }

    tasks.push({
      id: `990e8400-e29b-41d4-a716-44665544${String(1000 + i).padStart(4, '0')}`,
      title,
      description: `Detailed description for: ${title.toLowerCase()}. This task requires careful attention to implementation details and testing.`,
      project_id: projects[Math.floor(Math.random() * projects.length)],
      assignee_id: Math.random() > 0.1 ? users[Math.floor(Math.random() * users.length)] : null,
      reporter_id: users[Math.floor(Math.random() * users.length)],
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      type,
      story_points: [1, 2, 3, 5, 8][Math.floor(Math.random() * 5)],
      time_estimate: Math.floor(Math.random() * 800) + 120,
      time_spent: timeSpent,
      due_date: new Date(createdDate.getTime() + (Math.random() * 21 + 7) * 24 * 60 * 60 * 1000),
      position: i + 1,
      completed_at: completedDate,
      started_at: status === 'in_progress' || completedDate ? new Date(createdDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
      created_at: createdDate,
      updated_at: completedDate || new Date(createdDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000),
    });
  }

  await knex('tasks').insert(tasks);
};