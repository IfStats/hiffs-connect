CREATE TABLE "WebhookReceipt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerStatus" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookReceipt_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"WebhookReceipt_provider_eventKey_key"
ON "WebhookReceipt"(
    "provider",
    "eventKey"
);

CREATE INDEX
"WebhookReceipt_provider_idx"
ON "WebhookReceipt"("provider");

CREATE INDEX
"WebhookReceipt_providerMessageId_idx"
ON "WebhookReceipt"("providerMessageId");

CREATE INDEX
"WebhookReceipt_createdAt_idx"
ON "WebhookReceipt"("createdAt");