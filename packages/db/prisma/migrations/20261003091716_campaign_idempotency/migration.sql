/*
  Warnings:

  - Added the required column `clientRequestId` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "clientRequestId" TEXT NOT NULL;
