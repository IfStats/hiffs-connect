-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "billingCurrency" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "CountryPricing" ADD COLUMN     "providerCostCurrency" VARCHAR(3) NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "providerCostCurrency" VARCHAR(3);
