import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';

const { Client } = pg;

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL_UNPOOLED or DATABASE_URL is required',
  );
}

const sql = fs.readFileSync(
  '../../packages/db/prisma/migrations/20260925100000_webhook_receipts/migration.sql',
  'utf8',
);

const client = new Client({
  connectionString,
});

await client.connect();

try {
  await client.query(sql);

  console.log(
    'WebhookReceipt migration applied successfully.',
  );
} finally {
  await client.end();
}