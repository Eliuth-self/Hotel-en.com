const { pool } = require('../config/database');

async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'The database operation and its rollback both failed.',
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
