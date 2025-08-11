import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']).defaultTo('planning');
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.date('start_date').nullable();
    table.date('due_date').nullable();
    table.integer('progress').defaultTo(0).checkBetween([0, 100]);
    table.string('color').defaultTo('#3B82F6');
    table.boolean('is_archived').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['team_id']);
    table.index(['owner_id']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['due_date']);
    table.index(['is_archived']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('projects');
}