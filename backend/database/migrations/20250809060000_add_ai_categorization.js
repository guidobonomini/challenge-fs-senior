exports.up = function(knex) {
  return knex.schema
    .createTable('task_categories', function(table) {
      table.uuid('id').primary();
      table.string('name', 100).notNullable();
      table.string('description', 500);
      table.string('color', 7).defaultTo('#6b7280'); // hex color code
      table.string('icon', 50).defaultTo('tag'); // heroicon name
      table.boolean('is_system').defaultTo(false); // system vs user-defined categories
      table.integer('sort_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index(['is_active', 'sort_order']);
      table.unique(['name']);
    })
    .then(() => {
      return knex.schema.alterTable('tasks', function(table) {
        table.uuid('category_id').references('id').inTable('task_categories').onDelete('SET NULL');
        table.float('ai_confidence_score', 2, 2); // 0.00 to 1.00
        table.json('ai_suggested_categories'); // array of {category_id, confidence}
        table.boolean('ai_categorized').defaultTo(false);
        table.timestamp('ai_categorized_at');
        
        table.index(['category_id']);
        table.index(['ai_categorized']);
      });
    })
    .then(() => {
      return knex.schema.createTable('ai_categorization_history', function(table) {
        table.uuid('id').primary();
        table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
        table.uuid('category_id').references('id').inTable('task_categories').onDelete('CASCADE');
        table.uuid('suggested_by_user_id').references('id').inTable('users').onDelete('SET NULL');
        table.float('confidence_score', 2, 2);
        table.json('ai_analysis'); // detailed AI analysis results
        table.string('action', 50); // 'suggested', 'accepted', 'rejected', 'manual'
        table.text('feedback'); // user feedback on AI suggestion
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        table.index(['task_id', 'created_at']);
        table.index(['category_id']);
        table.index(['action']);
      });
    })
    .then(() => {
      // Insert default system categories
      return knex('task_categories').insert([
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Bug Fix',
          description: 'Tasks related to fixing bugs and issues',
          color: '#ef4444',
          icon: 'bug-ant',
          is_system: true,
          sort_order: 1
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Feature Development',
          description: 'New feature implementation tasks',
          color: '#3b82f6',
          icon: 'sparkles',
          is_system: true,
          sort_order: 2
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Documentation',
          description: 'Documentation and knowledge base tasks',
          color: '#8b5cf6',
          icon: 'document-text',
          is_system: true,
          sort_order: 3
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Testing',
          description: 'Quality assurance and testing tasks',
          color: '#10b981',
          icon: 'beaker',
          is_system: true,
          sort_order: 4
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Research',
          description: 'Research and investigation tasks',
          color: '#f59e0b',
          icon: 'magnifying-glass',
          is_system: true,
          sort_order: 5
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Maintenance',
          description: 'Code refactoring and maintenance tasks',
          color: '#6b7280',
          icon: 'wrench-screwdriver',
          is_system: true,
          sort_order: 6
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'UI/UX',
          description: 'User interface and experience tasks',
          color: '#ec4899',
          icon: 'paint-brush',
          is_system: true,
          sort_order: 7
        },
        {
          id: knex.raw('gen_random_uuid()'),
          name: 'Performance',
          description: 'Performance optimization tasks',
          color: '#f97316',
          icon: 'rocket-launch',
          is_system: true,
          sort_order: 8
        }
      ]);
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('tasks', function(table) {
      table.dropColumn('category_id');
      table.dropColumn('ai_confidence_score');
      table.dropColumn('ai_suggested_categories');
      table.dropColumn('ai_categorized');
      table.dropColumn('ai_categorized_at');
    })
    .then(() => {
      return knex.schema.dropTableIfExists('ai_categorization_history');
    })
    .then(() => {
      return knex.schema.dropTableIfExists('task_categories');
    });
};