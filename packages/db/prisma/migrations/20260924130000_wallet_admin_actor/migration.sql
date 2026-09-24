ALTER TABLE "WalletTransaction"
ADD COLUMN IF NOT EXISTS "performedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "WalletTransaction_performedByUserId_idx"
ON "WalletTransaction"("performedByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'WalletTransaction_performedByUserId_fkey'
  ) THEN
    ALTER TABLE "WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_performedByUserId_fkey"
    FOREIGN KEY ("performedByUserId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END
$$;