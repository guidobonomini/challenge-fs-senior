const { Knex } = require('knex');

exports.seed = async function(knex) {
  await knex('projects').del();

  await knex('projects').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      name: 'Task Management Platform',
      description: 'Build a comprehensive task management system with real-time collaboration',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      status: 'active',
      priority: 'high',
      start_date: new Date('2024-01-01'),
      due_date: new Date('2024-06-30'),
      progress: 45,
      color: '#3B82F6',
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440002',
      name: 'Mobile App Development',
      description: 'Develop React Native mobile app for the task management platform',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      status: 'planning',
      priority: 'medium',
      start_date: new Date('2024-03-01'),
      due_date: new Date('2024-08-31'),
      progress: 10,
      color: '#10B981',
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440003',
      name: 'UI/UX Redesign',
      description: 'Complete redesign of the user interface and experience',
      team_id: '660e8400-e29b-41d4-a716-446655440002',
      owner_id: '550e8400-e29b-41d4-a716-446655440005',
      status: 'active',
      priority: 'medium',
      start_date: new Date('2024-02-01'),
      due_date: new Date('2024-05-31'),
      progress: 75,
      color: '#8B5CF6',
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};