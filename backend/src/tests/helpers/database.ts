import { v4 as uuidv4 } from 'uuid';

// Helper to make migrations work with both PostgreSQL and SQLite
export function getUuidDefault(knex: any) {
  const client = knex.client.config.client;
  if (client === 'postgresql') {
    return knex.raw('gen_random_uuid()');
  } else if (client === 'sqlite3') {
    // For SQLite, we'll use a trigger to generate UUIDs
    return uuidv4();
  }
  return uuidv4();
}

// Helper to create a table with UUID primary key that works with both databases
export function createTableWithUuid(knex: any, tableName: string, callback: (table: any) => void) {
  return knex.schema.createTable(tableName, (table: any) => {
    const client = knex.client.config.client;
    
    if (client === 'postgresql') {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    } else {
      table.string('id').primary();
    }
    
    callback(table);
  });
}

// Generate UUID for tests
export function generateUuid(): string {
  return uuidv4();
}