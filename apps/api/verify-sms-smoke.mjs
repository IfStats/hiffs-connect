import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL_UNPOOLED or DATABASE_URL is required',
  );
}

const client = new Client({
  connectionString,
});

await client.connect();

try {
  console.log('\nLATEST SMS MESSAGES\n');

  const messages =
    await client.query(`
      SELECT
        "id",
        "businessId",
        "provider",
        "providerMessageId",
        "sender",
        "recipient",
        "status",
        "characterCount",
        "segmentCount",
        "smsEncoding",
        "providerCost",
        "customerPrice",
        "currency",
        "createdAt"
      FROM "Message"
      WHERE "channel" = 'SMS'
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `);

  console.table(messages.rows);

  console.log('\nLATEST SMS WALLET DEBITS\n');

  const transactions =
    await client.query(`
      SELECT
        wt."id",
        wt."messageId",
        wt."type",
        wt."status",
        wt."amount",
        wt."currency",
        wt."balanceBefore",
        wt."balanceAfter",
        wt."description",
        wt."createdAt"
      FROM "WalletTransaction" wt
      WHERE wt."type" = 'MESSAGE_DEBIT'
      ORDER BY wt."createdAt" DESC
      LIMIT 10;
    `);

  console.table(transactions.rows);

  console.log('\nCURRENT WALLET BALANCES\n');

  const wallets =
    await client.query(`
      SELECT
        "businessId",
        "currency",
        "balance",
        "updatedAt"
      FROM "Wallet"
      ORDER BY "updatedAt" DESC
      LIMIT 10;
    `);

  console.table(wallets.rows);
} finally {
  await client.end();
}