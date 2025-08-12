exports.up = async function(knex) {
  // Add category_id to tasks table if it doesn't exist
  const hasColumn = await knex.schema.hasColumn('tasks', 'category_id');
  if (!hasColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      table.uuid('category_id').nullable();
      table.decimal('confidence', 3, 2).nullable();
      table.text('ai_reasoning').nullable();
    });
  }

  // Create categories table if it doesn't exist
  const hasTable = await knex.schema.hasTable('categories');
  if (!hasTable) {
    await knex.schema.createTable('categories', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable().unique();
      table.text('description').nullable();
      table.string('color', 7).defaultTo('#3B82F6');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('categories');
  
  const hasColumn = await knex.schema.hasColumn('tasks', 'category_id');
  if (hasColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      table.dropColumn('category_id');
      table.dropColumn('confidence');
      table.dropColumn('ai_reasoning');
    });
  }
};