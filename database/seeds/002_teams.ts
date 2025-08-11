const { Knex } = require('knex');

exports.seed = async function(knex) {
  await knex('teams').del();

  await knex('teams').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Development Team',
      description: 'Main development team responsible for product features',
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'Design Team',
      description: 'UI/UX design and creative team',
      owner_id: '550e8400-e29b-41d4-a716-446655440002',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'Marketing Team',
      description: 'Marketing and growth team',
      owner_id: '550e8400-e29b-41d4-a716-446655440001',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};