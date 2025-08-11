const { Knex } = require('knex');

exports.up = async function(knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', [
      'task_assigned', 
      'task_updated', 
      'task_commented', 
      'task_completed',
      'project_updated',
      'team_invitation',
      'deadline_reminder'
    ]).notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('data').nullable();
    table.boolean('is_read').defaultTo(false);
    table.boolean('is_email_sent').defaultTo(false);
    table.uuid('related_task_id').nullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('related_project_id').nullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('triggered_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['type']);
    table.index(['is_read']);
    table.index(['related_task_id']);
    table.index(['related_project_id']);
    table.index(['created_at']);
  });
}

exports.down = async function(knex) {
  return knex.schema.dropTable('notifications');
};