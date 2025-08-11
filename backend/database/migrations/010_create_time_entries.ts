import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('time_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('description').nullable();
    table.integer('duration').notNullable();
    table.timestamp('started_at').notNullable();
    table.timestamp('ended_at').nullable();
    table.boolean('is_running').defaultTo(false);
    table.date('date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['date']);
    table.index(['is_running']);
    table.index(['started_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('time_entries');
}