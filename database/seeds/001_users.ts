const { Knex } = require('knex');
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('password123', 12);

  await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@demo.com',
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Admin',
      role: 'admin',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'manager@demo.com',
      password_hash: hashedPassword,
      first_name: 'Project',
      last_name: 'Manager',
      role: 'manager',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'user@demo.com',
      password_hash: hashedPassword,
      first_name: 'Team',
      last_name: 'Member',
      role: 'member',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'john.dev@demo.com',
      password_hash: hashedPassword,
      first_name: 'John',
      last_name: 'Developer',
      role: 'member',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      email: 'sarah.designer@demo.com',
      password_hash: hashedPassword,
      first_name: 'Sarah',
      last_name: 'Designer',
      role: 'member',
      email_verified: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};