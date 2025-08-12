exports.up = async function(knex) {
  // Create AI categorization suggestions table
  await knex.schema.createTableIfNotExists('ai_categorization_suggestions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('suggested_category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    table.decimal('confidence', 3, 2).notNullable();
    table.text('reasoning').nullable();
    table.boolean('is_accepted').defaultTo(false);
    table.timestamp('suggested_at').defaultTo(knex.fn.now());
    table.timestamp('responded_at').nullable();
    
    table.index(['task_id']);
    table.index(['suggested_category_id']);
    table.index(['is_accepted']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_categorization_suggestions');
};