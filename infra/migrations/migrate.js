const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../services/api/.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

async function runMigrations() {
  const isRemote = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  const client = new Client({
    connectionString,
    ssl: isRemote ? { rejectUnauthorized: false } : undefined
  });
  
  try {
    await client.connect();
    console.log('Connected to database. Setting up migrations...');

    // 1. Create schema_migrations if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read all SQL files in the sql/ directory
    const sqlDir = path.join(__dirname, 'sql');
    if (!fs.existsSync(sqlDir)) {
      fs.mkdirSync(sqlDir, { recursive: true });
    }

    const files = fs.readdirSync(sqlDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    if (files.length === 0) {
      console.log('No migration files found in: ' + sqlDir);
      return;
    }

    // 3. Run each migration if not already applied
    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`Migration ${file} is already applied.`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');

      // Start transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Successfully applied ${file}.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error applying migration ${file}:`, err);
        throw err;
      }
    }

    console.log('All migrations applied successfully.');
  } catch (error) {
    console.error('Migration run failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
