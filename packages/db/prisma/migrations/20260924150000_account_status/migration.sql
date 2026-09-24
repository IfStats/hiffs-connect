DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AccountStatus'
  ) THEN
    CREATE TYPE "AccountStatus" AS ENUM (
      'ACTIVE',
      'SUSPENDED',
      'RESTRICTED'
    );
  END IF;
END
$$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Business"
ADD COLUMN IF NOT EXISTS "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';