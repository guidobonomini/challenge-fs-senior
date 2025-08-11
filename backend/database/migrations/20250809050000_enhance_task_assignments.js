/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('task_assignments', (table) => {
      table.uuid('id').primary();
      table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('assigned_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('role', ['assignee', 'reviewer', 'collaborator']).defaultTo('assignee');
      table.text('notes').nullable();
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.timestamp('unassigned_at').nullable();
      table.timestamps(true, true);
      
      // Prevent duplicate active assignments
      table.unique(['task_id', 'user_id', 'role']);
      table.index(['task_id']);
      table.index(['user_id']);
    })
    .createTable('assignment_history', (table) => {
      table.uuid('id').primary();
      table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.uuid('changed_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('action', ['assigned', 'unassigned', 'role_changed']).notNullable();
      table.enum('previous_role', ['assignee', 'reviewer', 'collaborator']).nullable();
      table.enum('new_role', ['assignee', 'reviewer', 'collaborator']).nullable();
      table.text('notes').nullable();
      table.timestamps(true, true);
      
      table.index(['task_id', 'created_at']);
      table.index(['user_id', 'created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('assignment_history')
    .dropTable('task_assignments');
};