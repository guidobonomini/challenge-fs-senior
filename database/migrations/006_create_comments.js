const { Knex } = require('knex');

exports.up = async function(knex) {
  return knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('content').notNullable();
    table.uuid('parent_comment_id').nullable().references('id').inTable('comments').onDelete('CASCADE');
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['parent_comment_id']);
    table.index(['created_at']);
  });
}

exports.down = async function(knex) {
  return knex.schema.dropTable('comments');
};