CREATE TYPE "SmsEncoding" AS ENUM (
    'GSM7',
    'UCS2'
);

ALTER TABLE "Message"
ADD COLUMN "characterCount" INTEGER,
ADD COLUMN "segmentCount" INTEGER,
ADD COLUMN "smsEncoding" "SmsEncoding";