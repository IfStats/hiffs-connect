CREATE TABLE "AuthRefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthRefreshSession_tokenHash_key"
ON "AuthRefreshSession"("tokenHash");

CREATE INDEX "AuthRefreshSession_userId_idx"
ON "AuthRefreshSession"("userId");

CREATE INDEX "AuthRefreshSession_expiresAt_idx"
ON "AuthRefreshSession"("expiresAt");

CREATE INDEX "AuthRefreshSession_revokedAt_idx"
ON "AuthRefreshSession"("revokedAt");

ALTER TABLE "AuthRefreshSession"
ADD CONSTRAINT "AuthRefreshSession_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;