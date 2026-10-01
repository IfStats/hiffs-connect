-- CreateEnum
CREATE TYPE "SenderValidationStatus" AS ENUM ('PENDING', 'INTERNAL_REVIEW', 'DOCUMENTS_REQUIRED', 'READY_FOR_PROVIDER', 'PROVIDER_SUBMITTED', 'PROVIDER_PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SenderDocumentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "SenderRequirement" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'SMS',
    "senderType" "SenderType" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "fieldKey" TEXT,
    "documentType" TEXT,
    "validationRule" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderValidation" (
    "id" TEXT NOT NULL,
    "senderRegistrationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "status" "SenderValidationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerUserId" TEXT,
    "reviewNotes" TEXT,
    "providerReference" TEXT,
    "submittedToProviderAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderDocument" (
    "id" TEXT NOT NULL,
    "senderRegistrationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "SenderDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SenderRequirement_provider_idx" ON "SenderRequirement"("provider");

-- CreateIndex
CREATE INDEX "SenderRequirement_countryCode_idx" ON "SenderRequirement"("countryCode");

-- CreateIndex
CREATE INDEX "SenderRequirement_channel_idx" ON "SenderRequirement"("channel");

-- CreateIndex
CREATE INDEX "SenderRequirement_senderType_idx" ON "SenderRequirement"("senderType");

-- CreateIndex
CREATE INDEX "SenderRequirement_active_idx" ON "SenderRequirement"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SenderRequirement_provider_countryCode_channel_senderType_k_key" ON "SenderRequirement"("provider", "countryCode", "channel", "senderType", "key");

-- CreateIndex
CREATE INDEX "SenderValidation_senderRegistrationId_idx" ON "SenderValidation"("senderRegistrationId");

-- CreateIndex
CREATE INDEX "SenderValidation_provider_idx" ON "SenderValidation"("provider");

-- CreateIndex
CREATE INDEX "SenderValidation_countryCode_idx" ON "SenderValidation"("countryCode");

-- CreateIndex
CREATE INDEX "SenderValidation_status_idx" ON "SenderValidation"("status");

-- CreateIndex
CREATE INDEX "SenderValidation_reviewerUserId_idx" ON "SenderValidation"("reviewerUserId");

-- CreateIndex
CREATE INDEX "SenderDocument_senderRegistrationId_idx" ON "SenderDocument"("senderRegistrationId");

-- CreateIndex
CREATE INDEX "SenderDocument_documentType_idx" ON "SenderDocument"("documentType");

-- CreateIndex
CREATE INDEX "SenderDocument_status_idx" ON "SenderDocument"("status");

-- AddForeignKey
ALTER TABLE "SenderValidation" ADD CONSTRAINT "SenderValidation_senderRegistrationId_fkey" FOREIGN KEY ("senderRegistrationId") REFERENCES "SenderRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderValidation" ADD CONSTRAINT "SenderValidation_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderDocument" ADD CONSTRAINT "SenderDocument_senderRegistrationId_fkey" FOREIGN KEY ("senderRegistrationId") REFERENCES "SenderRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
