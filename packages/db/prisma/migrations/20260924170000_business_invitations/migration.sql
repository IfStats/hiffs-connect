DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'InvitationStatus'
  ) THEN
    CREATE TYPE "InvitationStatus" AS ENUM (
      'PENDING',
      'ACCEPTED',
      'REVOKED',
      'EXPIRED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "BusinessInvitation" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "BusinessRole" NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "invitedByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessInvitation_businessId_fkey"
    FOREIGN KEY ("businessId")
    REFERENCES "Business"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT "BusinessInvitation_invitedByUserId_fkey"
    FOREIGN KEY ("invitedByUserId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT "BusinessInvitation_acceptedByUserId_fkey"
    FOREIGN KEY ("acceptedByUserId")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BusinessInvitation_businessId_idx"
ON "BusinessInvitation"("businessId");

CREATE INDEX IF NOT EXISTS "BusinessInvitation_email_idx"
ON "BusinessInvitation"("email");

CREATE INDEX IF NOT EXISTS "BusinessInvitation_status_idx"
ON "BusinessInvitation"("status");

CREATE INDEX IF NOT EXISTS "BusinessInvitation_expiresAt_idx"
ON "BusinessInvitation"("expiresAt");

CREATE INDEX IF NOT EXISTS "BusinessInvitation_invitedByUserId_idx"
ON "BusinessInvitation"("invitedByUserId");

CREATE INDEX IF NOT EXISTS "BusinessInvitation_acceptedByUserId_idx"
ON "BusinessInvitation"("acceptedByUserId");