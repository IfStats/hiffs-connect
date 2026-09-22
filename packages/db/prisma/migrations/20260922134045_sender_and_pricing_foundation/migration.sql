-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'ACCEPTED', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('SHARED', 'DEDICATED');

-- CreateEnum
CREATE TYPE "SenderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PricingStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderRegistration" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderValue" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "destinationCountry" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'infobip',
    "providerReference" TEXT,
    "status" "SenderStatus" NOT NULL DEFAULT 'DRAFT',
    "useCase" TEXT,
    "estimatedMonthlyVolume" INTEGER,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryPricing" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "network" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'infobip',
    "providerCost" DECIMAL(12,6) NOT NULL,
    "retailPrice" DECIMAL(12,6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "minVolume" INTEGER,
    "maxVolume" INTEGER,
    "status" "PricingStatus" NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "senderRegistrationId" TEXT,
    "channel" "MessageChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "sender" TEXT,
    "recipient" TEXT NOT NULL,
    "countryCode" TEXT,
    "destinationCountry" TEXT,
    "network" TEXT,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "providerCost" DECIMAL(12,6),
    "customerPrice" DECIMAL(12,6),
    "currency" VARCHAR(3),
    "providerResponse" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Business_countryCode_idx" ON "Business"("countryCode");

-- CreateIndex
CREATE INDEX "Business_name_idx" ON "Business"("name");

-- CreateIndex
CREATE INDEX "SenderRegistration_businessId_idx" ON "SenderRegistration"("businessId");

-- CreateIndex
CREATE INDEX "SenderRegistration_countryCode_idx" ON "SenderRegistration"("countryCode");

-- CreateIndex
CREATE INDEX "SenderRegistration_status_idx" ON "SenderRegistration"("status");

-- CreateIndex
CREATE INDEX "SenderRegistration_providerReference_idx" ON "SenderRegistration"("providerReference");

-- CreateIndex
CREATE INDEX "CountryPricing_countryCode_idx" ON "CountryPricing"("countryCode");

-- CreateIndex
CREATE INDEX "CountryPricing_channel_idx" ON "CountryPricing"("channel");

-- CreateIndex
CREATE INDEX "CountryPricing_provider_idx" ON "CountryPricing"("provider");

-- CreateIndex
CREATE INDEX "CountryPricing_status_idx" ON "CountryPricing"("status");

-- CreateIndex
CREATE INDEX "Message_businessId_idx" ON "Message"("businessId");

-- CreateIndex
CREATE INDEX "Message_senderRegistrationId_idx" ON "Message"("senderRegistrationId");

-- CreateIndex
CREATE INDEX "Message_recipient_idx" ON "Message"("recipient");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_providerMessageId_idx" ON "Message"("providerMessageId");

-- CreateIndex
CREATE INDEX "Message_countryCode_idx" ON "Message"("countryCode");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- AddForeignKey
ALTER TABLE "SenderRegistration" ADD CONSTRAINT "SenderRegistration_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderRegistrationId_fkey" FOREIGN KEY ("senderRegistrationId") REFERENCES "SenderRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
