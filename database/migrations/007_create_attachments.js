const { Knex } = require('knex');

exports.up = async function(knex) {
  return knex.schema.createTable('attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').nullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('comment_id').nullable().references('id').inTable('comments').onDelete('CASCADE');
    table.uuid('uploaded_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('original_filename').notNullable();
    table.string('mime_type').notNullable();
    table.integer('file_size').notNullable();
    table.string('file_path').notNullable();
    table.string('file_url').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['task_id']);
    table.index(['comment_id']);
    table.index(['uploaded_by']);
    table.index(['created_at']);
    
    table.check('(task_id IS NOT NULL) OR (comment_id IS NOT NULL)');
  });
}

exports.down = async function(knex) {
  return knex.schema.dropTable('attachments');
};