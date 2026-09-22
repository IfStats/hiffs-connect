-- CreateTable
CREATE TABLE "ProviderRoutingRule" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "network" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderRoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderRoutingRule_countryCode_idx" ON "ProviderRoutingRule"("countryCode");

-- CreateIndex
CREATE INDEX "ProviderRoutingRule_channel_idx" ON "ProviderRoutingRule"("channel");

-- CreateIndex
CREATE INDEX "ProviderRoutingRule_provider_idx" ON "ProviderRoutingRule"("provider");

-- CreateIndex
CREATE INDEX "ProviderRoutingRule_priority_idx" ON "ProviderRoutingRule"("priority");

-- CreateIndex
CREATE INDEX "ProviderRoutingRule_enabled_idx" ON "ProviderRoutingRule"("enabled");
