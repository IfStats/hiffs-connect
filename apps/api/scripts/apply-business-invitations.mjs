import fs from 'node:fs/promises';
import pg from 'pg';

const { DATABASE_URL_UNPOOLED } = process.env;

if (!DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED is not configured');
}

const sql = await fs.readFile(
  '../../packages/db/prisma/migrations/20260924170000_business_invitations/migration.sql',
  'utf8',
);

const client = new pg.Client({
  connectionString: DATABASE_URL_UNPOOLED,
});

try {
  await client.connect();

  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');

  console.log('business_invitations migration applied successfully');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}