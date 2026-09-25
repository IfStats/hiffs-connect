CREATE TYPE "ContactStatus" AS ENUM (
    'ACTIVE',
    'UNSUBSCRIBED',
    'BLOCKED'
);

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "ContactGroup" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactGroup_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "ContactGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactGroupMember_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"Contact_businessId_phone_key"
ON "Contact"("businessId", "phone");

CREATE INDEX
"Contact_businessId_idx"
ON "Contact"("businessId");

CREATE INDEX
"Contact_phone_idx"
ON "Contact"("phone");

CREATE INDEX
"Contact_email_idx"
ON "Contact"("email");

CREATE INDEX
"Contact_status_idx"
ON "Contact"("status");

CREATE INDEX
"Contact_createdAt_idx"
ON "Contact"("createdAt");

CREATE UNIQUE INDEX
"ContactGroup_businessId_name_key"
ON "ContactGroup"("businessId", "name");

CREATE INDEX
"ContactGroup_businessId_idx"
ON "ContactGroup"("businessId");

CREATE INDEX
"ContactGroup_name_idx"
ON "ContactGroup"("name");

CREATE UNIQUE INDEX
"ContactGroupMember_groupId_contactId_key"
ON "ContactGroupMember"("groupId", "contactId");

CREATE INDEX
"ContactGroupMember_groupId_idx"
ON "ContactGroupMember"("groupId");

CREATE INDEX
"ContactGroupMember_contactId_idx"
ON "ContactGroupMember"("contactId");

ALTER TABLE "Contact"
ADD CONSTRAINT "Contact_businessId_fkey"
FOREIGN KEY ("businessId")
REFERENCES "Business"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ContactGroup"
ADD CONSTRAINT "ContactGroup_businessId_fkey"
FOREIGN KEY ("businessId")
REFERENCES "Business"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ContactGroupMember"
ADD CONSTRAINT "ContactGroupMember_groupId_fkey"
FOREIGN KEY ("groupId")
REFERENCES "ContactGroup"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ContactGroupMember"
ADD CONSTRAINT "ContactGroupMember_contactId_fkey"
FOREIGN KEY ("contactId")
REFERENCES "Contact"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;