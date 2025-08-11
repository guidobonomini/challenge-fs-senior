import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('avatar_url').nullable();
    table.enum('role', ['admin', 'manager', 'member']).defaultTo('member');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token').nullable();
    table.string('password_reset_token').nullable();
    table.timestamp('password_reset_expires').nullable();
    table.timestamp('last_login').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['email']);
    table.index(['role']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}