exports.up = async function(knex) {
  // Add the missing 'type' column to tasks table
  const hasColumn = await knex.schema.hasColumn('tasks', 'type');
  if (!hasColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      table.enum('type', ['task', 'bug', 'feature', 'epic']).defaultTo('task');
    });
    
    // Add index for the type column
    await knex.schema.alterTable('tasks', (table) => {
      table.index(['type']);
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('tasks', 'type');
  if (hasColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      table.dropIndex(['type']);
      table.dropColumn('type');
    });
  }
};