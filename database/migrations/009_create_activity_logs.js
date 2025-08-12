const { Knex } = require('knex');

exports.up = async function(knex) {
  return knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('action', [
      'create', 
      'update', 
      'delete', 
      'assign', 
      'unassign',
      'comment',
      'upload',
      'status_change',
      'login',
      'logout'
    ]).notNullable();
    table.enum('entity_type', [
      'user',
      'team', 
      'project', 
      'task', 
      'comment', 
      'attachment'
    ]).notNullable();
    table.uuid('entity_id').nullable();
    table.text('description').notNullable();
    table.jsonb('old_values').nullable();
    table.jsonb('new_values').nullable();
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['user_id']);
    table.index(['action']);
    table.index(['entity_type']);
    table.index(['entity_id']);
    table.index(['created_at']);
  });
}

exports.down = async function(knex) {
  return knex.schema.dropTable('activity_logs');
};