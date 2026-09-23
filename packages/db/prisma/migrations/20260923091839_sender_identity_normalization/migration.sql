-- CreateTable
CREATE TABLE "SenderIdentity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderValue" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "status" "SenderStatus" NOT NULL DEFAULT 'DRAFT',
    "useCase" TEXT,
    "estimatedMonthlyVolume" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SenderIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSenderRegistration" (
    "id" TEXT NOT NULL,
    "senderIdentityId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerReference" TEXT,
    "providerSenderId" TEXT,
    "status" "SenderStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSenderRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SenderIdentity_businessId_idx" ON "SenderIdentity"("businessId");

-- CreateIndex
CREATE INDEX "SenderIdentity_countryCode_idx" ON "SenderIdentity"("countryCode");

-- CreateIndex
CREATE INDEX "SenderIdentity_channel_idx" ON "SenderIdentity"("channel");

-- CreateIndex
CREATE INDEX "SenderIdentity_status_idx" ON "SenderIdentity"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SenderIdentity_businessId_channel_senderValue_countryCode_key" ON "SenderIdentity"("businessId", "channel", "senderValue", "countryCode");

-- CreateIndex
CREATE INDEX "ProviderSenderRegistration_senderIdentityId_idx" ON "ProviderSenderRegistration"("senderIdentityId");

-- CreateIndex
CREATE INDEX "ProviderSenderRegistration_providerId_idx" ON "ProviderSenderRegistration"("providerId");

-- CreateIndex
CREATE INDEX "ProviderSenderRegistration_status_idx" ON "ProviderSenderRegistration"("status");

-- CreateIndex
CREATE INDEX "ProviderSenderRegistration_providerReference_idx" ON "ProviderSenderRegistration"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSenderRegistration_senderIdentityId_providerId_key" ON "ProviderSenderRegistration"("senderIdentityId", "providerId");

-- AddForeignKey
ALTER TABLE "SenderIdentity" ADD CONSTRAINT "SenderIdentity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSenderRegistration" ADD CONSTRAINT "ProviderSenderRegistration_senderIdentityId_fkey" FOREIGN KEY ("senderIdentityId") REFERENCES "SenderIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSenderRegistration" ADD CONSTRAINT "ProviderSenderRegistration_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
