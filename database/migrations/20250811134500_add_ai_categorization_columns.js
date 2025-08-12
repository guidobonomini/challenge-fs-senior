exports.up = async function(knex) {
  // Add missing AI categorization columns to tasks table
  const hasAiCategorizedColumn = await knex.schema.hasColumn('tasks', 'ai_categorized');
  const hasAiConfidenceScoreColumn = await knex.schema.hasColumn('tasks', 'ai_confidence_score');
  const hasAiSuggestedCategoriesColumn = await knex.schema.hasColumn('tasks', 'ai_suggested_categories');
  const hasAiCategorizedAtColumn = await knex.schema.hasColumn('tasks', 'ai_categorized_at');

  if (!hasAiCategorizedColumn || !hasAiConfidenceScoreColumn || !hasAiSuggestedCategoriesColumn || !hasAiCategorizedAtColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      if (!hasAiCategorizedColumn) {
        table.boolean('ai_categorized').defaultTo(false);
      }
      if (!hasAiConfidenceScoreColumn) {
        table.decimal('ai_confidence_score', 3, 2).nullable();
      }
      if (!hasAiSuggestedCategoriesColumn) {
        table.jsonb('ai_suggested_categories').nullable();
      }
      if (!hasAiCategorizedAtColumn) {
        table.timestamp('ai_categorized_at').nullable();
      }
    });
  }

  // Create AI categorization history table if it doesn't exist
  const hasHistoryTable = await knex.schema.hasTable('ai_categorization_history');
  if (!hasHistoryTable) {
    await knex.schema.createTable('ai_categorization_history', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('task_id').notNullable();
      table.uuid('category_id').notNullable();
      table.uuid('suggested_by_user_id').nullable();
      table.decimal('confidence_score', 3, 2).nullable();
      table.jsonb('ai_analysis').nullable();
      table.enum('action', ['suggested', 'accepted', 'rejected', 'manual']).notNullable();
      table.text('feedback').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Foreign key constraints
      table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE');
      table.foreign('suggested_by_user_id').references('id').inTable('users').onDelete('SET NULL');
    });
  }
};

exports.down = async function(knex) {
  // Drop AI categorization history table
  await knex.schema.dropTableIfExists('ai_categorization_history');

  // Remove AI categorization columns from tasks table
  const hasAiCategorizedColumn = await knex.schema.hasColumn('tasks', 'ai_categorized');
  const hasAiConfidenceScoreColumn = await knex.schema.hasColumn('tasks', 'ai_confidence_score');
  const hasAiSuggestedCategoriesColumn = await knex.schema.hasColumn('tasks', 'ai_suggested_categories');
  const hasAiCategorizedAtColumn = await knex.schema.hasColumn('tasks', 'ai_categorized_at');

  if (hasAiCategorizedColumn || hasAiConfidenceScoreColumn || hasAiSuggestedCategoriesColumn || hasAiCategorizedAtColumn) {
    await knex.schema.alterTable('tasks', (table) => {
      if (hasAiCategorizedColumn) {
        table.dropColumn('ai_categorized');
      }
      if (hasAiConfidenceScoreColumn) {
        table.dropColumn('ai_confidence_score');
      }
      if (hasAiSuggestedCategoriesColumn) {
        table.dropColumn('ai_suggested_categories');
      }
      if (hasAiCategorizedAtColumn) {
        table.dropColumn('ai_categorized_at');
      }
    });
  }
};