-- CreateEnum
CREATE TYPE "SenderAuditAction" AS ENUM ('REGISTRATION_CREATED', 'REGISTRATION_SUBMITTED', 'VALIDATION_STARTED', 'DOCUMENTS_REQUESTED', 'REVIEW_RESUMED', 'DOCUMENT_UPLOADED', 'DOCUMENT_ACCEPTED', 'DOCUMENT_REJECTED', 'READY_FOR_PROVIDER', 'PROVIDER_SUBMITTED', 'PROVIDER_PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'RESTORED');

-- CreateTable
CREATE TABLE "SenderAuditEvent" (
    "id" TEXT NOT NULL,
    "senderRegistrationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" "SenderAuditAction" NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "documentId" TEXT,
    "documentType" TEXT,
    "provider" TEXT,
    "providerReference" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SenderAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SenderAuditEvent_senderRegistrationId_idx" ON "SenderAuditEvent"("senderRegistrationId");

-- CreateIndex
CREATE INDEX "SenderAuditEvent_actorUserId_idx" ON "SenderAuditEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "SenderAuditEvent_action_idx" ON "SenderAuditEvent"("action");

-- CreateIndex
CREATE INDEX "SenderAuditEvent_documentId_idx" ON "SenderAuditEvent"("documentId");

-- CreateIndex
CREATE INDEX "SenderAuditEvent_createdAt_idx" ON "SenderAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "SenderAuditEvent" ADD CONSTRAINT "SenderAuditEvent_senderRegistrationId_fkey" FOREIGN KEY ("senderRegistrationId") REFERENCES "SenderRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderAuditEvent" ADD CONSTRAINT "SenderAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
