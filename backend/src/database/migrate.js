require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { assertDatabaseConfiguration, pool } = require('../config/database');

async function migrate() {
  assertDatabaseConfiguration();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const directory = path.join(__dirname, 'migrations');
  const migrationNames = (await fs.readdir(directory))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const name of migrationNames) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const applied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [name],
      );

      if (applied.rowCount === 0) {
        const sql = await fs.readFile(path.join(directory, name), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        console.log(`Applied migration ${name}`);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Database migrations completed.'))
    .catch((error) => {
      console.error('Database migrations failed:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { migrate };
