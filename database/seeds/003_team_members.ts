const { Knex } = require('knex');

exports.seed = async function(knex) {
  await knex('team_members').del();

  await knex('team_members').insert([
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      role: 'manager',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      role: 'member',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440003',
      team_id: '660e8400-e29b-41d4-a716-446655440001',
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      role: 'member',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440004',
      team_id: '660e8400-e29b-41d4-a716-446655440002',
      user_id: '550e8400-e29b-41d4-a716-446655440005',
      role: 'member',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};