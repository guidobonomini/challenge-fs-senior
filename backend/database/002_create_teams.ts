import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('avatar_url').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['owner_id']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('teams');
}