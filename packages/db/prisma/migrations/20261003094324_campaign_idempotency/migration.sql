/*
  Warnings:

  - A unique constraint covering the columns `[businessId,clientRequestId]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Campaign_businessId_clientRequestId_key" ON "Campaign"("businessId", "clientRequestId");
