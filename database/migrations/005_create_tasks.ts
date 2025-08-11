const { Knex } = require('knex');

exports.up = async function(knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.text('description').nullable();
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('assignee_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('reporter_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.enum('status', ['todo', 'in_progress', 'in_review', 'done', 'cancelled']).defaultTo('todo');
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.enum('type', ['task', 'bug', 'feature', 'epic']).defaultTo('task');
    table.integer('story_points').nullable();
    table.integer('time_estimate').nullable();
    table.integer('time_spent').defaultTo(0);
    table.date('due_date').nullable();
    table.integer('position').defaultTo(0);
    table.uuid('parent_task_id').nullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.jsonb('custom_fields').nullable();
    table.boolean('is_archived').defaultTo(false);
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['project_id']);
    table.index(['assignee_id']);
    table.index(['reporter_id']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['type']);
    table.index(['due_date']);
    table.index(['parent_task_id']);
    table.index(['is_archived']);
    table.index(['position']);
  });
}

exports.down = async function(knex) {
  return knex.schema.dropTable('tasks');
};