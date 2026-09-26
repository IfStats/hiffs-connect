-- Add user phone identity
ALTER TABLE "User"
ADD COLUMN "phone" TEXT,
ADD COLUMN "phoneVerified" TIMESTAMP(3);

-- User phone numbers must be unique when present
CREATE UNIQUE INDEX "User_phone_key"
ON "User"("phone");

CREATE INDEX "User_phone_idx"
ON "User"("phone");

-- Phone verification attempts
CREATE TABLE "PhoneVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'infobip',
    "providerPinId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneVerification_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX "PhoneVerification_userId_idx"
ON "PhoneVerification"("userId");

CREATE INDEX "PhoneVerification_phone_idx"
ON "PhoneVerification"("phone");

CREATE INDEX "PhoneVerification_providerPinId_idx"
ON "PhoneVerification"("providerPinId");

CREATE INDEX "PhoneVerification_expiresAt_idx"
ON "PhoneVerification"("expiresAt");

CREATE INDEX "PhoneVerification_verifiedAt_idx"
ON "PhoneVerification"("verifiedAt");

ALTER TABLE "PhoneVerification"
ADD CONSTRAINT "PhoneVerification_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;