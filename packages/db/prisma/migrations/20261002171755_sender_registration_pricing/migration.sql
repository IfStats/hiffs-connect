-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'SENDER_REGISTRATION_FEE';

-- CreateTable
CREATE TABLE "SenderRegistrationPricing" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "providerCost" DECIMAL(12,6) NOT NULL,
    "providerCostCurrency" VARCHAR(3) NOT NULL,
    "retailPrice" DECIMAL(12,6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderRegistrationPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SenderRegistrationPricing_provider_idx" ON "SenderRegistrationPricing"("provider");

-- CreateIndex
CREATE INDEX "SenderRegistrationPricing_countryCode_idx" ON "SenderRegistrationPricing"("countryCode");

-- CreateIndex
CREATE INDEX "SenderRegistrationPricing_channel_idx" ON "SenderRegistrationPricing"("channel");

-- CreateIndex
CREATE INDEX "SenderRegistrationPricing_senderType_idx" ON "SenderRegistrationPricing"("senderType");

-- CreateIndex
CREATE INDEX "SenderRegistrationPricing_active_idx" ON "SenderRegistrationPricing"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SenderRegistrationPricing_provider_countryCode_channel_send_key" ON "SenderRegistrationPricing"("provider", "countryCode", "channel", "senderType", "currency", "effectiveFrom");
