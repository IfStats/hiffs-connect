-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('OWNER', 'ADMIN', 'DEVELOPER', 'BILLING', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'COMPLIANCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "platformRole" "PlatformRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL DEFAULT 'VIEWER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");

-- CreateIndex
CREATE INDEX "BusinessMembership_userId_idx" ON "BusinessMembership"("userId");

-- CreateIndex
CREATE INDEX "BusinessMembership_businessId_idx" ON "BusinessMembership"("businessId");

-- CreateIndex
CREATE INDEX "BusinessMembership_role_idx" ON "BusinessMembership"("role");

-- CreateIndex
CREATE INDEX "BusinessMembership_active_idx" ON "BusinessMembership"("active");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMembership_userId_businessId_key" ON "BusinessMembership"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
