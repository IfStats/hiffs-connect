-- CreateTable
CREATE TABLE "MessageRoutingAttempt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "routingRuleId" TEXT,
    "provider" TEXT NOT NULL,
    "priority" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "outcome" TEXT NOT NULL,
    "retryable" BOOLEAN,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRoutingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageRoutingAttempt_messageId_idx" ON "MessageRoutingAttempt"("messageId");

-- CreateIndex
CREATE INDEX "MessageRoutingAttempt_provider_idx" ON "MessageRoutingAttempt"("provider");

-- CreateIndex
CREATE INDEX "MessageRoutingAttempt_routingRuleId_idx" ON "MessageRoutingAttempt"("routingRuleId");

-- CreateIndex
CREATE INDEX "MessageRoutingAttempt_createdAt_idx" ON "MessageRoutingAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "MessageRoutingAttempt" ADD CONSTRAINT "MessageRoutingAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
