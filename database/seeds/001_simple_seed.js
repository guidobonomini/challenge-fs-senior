const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Clear existing data in correct order (respecting foreign key constraints)
  await knex('team_members').del();
  await knex('teams').del();
  await knex('users').del();

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash('password123', saltRounds);

  // Create test users for load tests
  const users = [
    {
      id: '369da553-1899-4724-bd9d-53dd5d236861',
      email: 'admin@demo.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      email_verified: true,
      created_at: new Date('2024-12-01'),
      updated_at: new Date('2024-12-01')
    },
    {
      id: '469da553-1899-4724-bd9d-53dd5d236862',
      email: 'manager@demo.com',
      password_hash: hashedPassword,
      first_name: 'Manager',
      last_name: 'User',
      role: 'member',
      is_active: true,
      email_verified: true,
      created_at: new Date('2024-12-01'),
      updated_at: new Date('2024-12-01')
    },
    {
      id: '569da553-1899-4724-bd9d-53dd5d236863',
      email: 'user@demo.com',
      password_hash: hashedPassword,
      first_name: 'Demo',
      last_name: 'User',
      role: 'member',
      is_active: true,
      email_verified: true,
      created_at: new Date('2024-12-01'),
      updated_at: new Date('2024-12-01')
    }
  ];

  await knex('users').insert(users);

  // Create a simple team
  const team = {
    id: '169da553-1899-4724-bd9d-53dd5d236864',
    name: 'Development Team',
    description: 'Main development team',
    owner_id: users[0].id,
    created_at: new Date('2024-12-01'),
    updated_at: new Date('2024-12-01')
  };

  await knex('teams').insert(team);

  // Add users to team
  const teamMembers = [
    {
      id: uuidv4(),
      team_id: team.id,
      user_id: users[0].id,
      role: 'admin',
      joined_at: new Date('2024-12-01')
    },
    {
      id: uuidv4(),
      team_id: team.id,
      user_id: users[1].id,
      role: 'member',
      joined_at: new Date('2024-12-01')
    },
    {
      id: uuidv4(),
      team_id: team.id,
      user_id: users[2].id,
      role: 'member',
      joined_at: new Date('2024-12-01')
    }
  ];

  await knex('team_members').insert(teamMembers);
};