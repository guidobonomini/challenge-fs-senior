import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('team_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['admin', 'manager', 'member']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['team_id', 'user_id']);
    table.index(['team_id']);
    table.index(['user_id']);
    table.index(['role']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('team_members');
}