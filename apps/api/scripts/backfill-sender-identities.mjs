import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const legacySenders = await prisma.senderRegistration.findMany();

  let identitiesCreated = 0;
  let providerRegistrationsCreated = 0;
  let providerRegistrationsUpdated = 0;
  let skipped = 0;

  for (const legacy of legacySenders) {
    const provider = await prisma.provider.findUnique({
      where: { code: legacy.provider },
    });

    if (!provider) {
      console.warn(
        `Skipping sender ${legacy.id}: provider "${legacy.provider}" is not registered`,
      );
      skipped++;
      continue;
    }

    let identity = await prisma.senderIdentity.findFirst({
      where: {
        businessId: legacy.businessId,
        channel: legacy.channel,
        senderValue: legacy.senderValue,
        countryCode: legacy.countryCode,
      },
    });

    if (!identity) {
      identity = await prisma.senderIdentity.create({
        data: {
          businessId: legacy.businessId,
          channel: legacy.channel,
          senderType: legacy.senderType,
          senderValue: legacy.senderValue,
          countryCode: legacy.countryCode,
          status: legacy.status,
          useCase: legacy.useCase,
          estimatedMonthlyVolume: legacy.estimatedMonthlyVolume,
        },
      });

      identitiesCreated++;
    }

    const existingProviderRegistration =
      await prisma.providerSenderRegistration.findFirst({
        where: {
          senderIdentityId: identity.id,
          providerId: provider.id,
        },
      });

    if (existingProviderRegistration) {
      await prisma.providerSenderRegistration.update({
        where: {
          id: existingProviderRegistration.id,
        },
        data: {
          providerReference: legacy.providerReference,
          status: legacy.status,
          submittedAt: legacy.submittedAt,
          approvedAt: legacy.approvedAt,
          rejectedAt: legacy.rejectedAt,
          rejectionReason: legacy.rejectionReason,
        },
      });

      providerRegistrationsUpdated++;
    } else {
      await prisma.providerSenderRegistration.create({
        data: {
          senderIdentityId: identity.id,
          providerId: provider.id,
          providerReference: legacy.providerReference,
          status: legacy.status,
          submittedAt: legacy.submittedAt,
          approvedAt: legacy.approvedAt,
          rejectedAt: legacy.rejectedAt,
          rejectionReason: legacy.rejectionReason,
        },
      });

      providerRegistrationsCreated++;
    }
  }

  console.log({
    legacySenders: legacySenders.length,
    identitiesCreated,
    providerRegistrationsCreated,
    providerRegistrationsUpdated,
    skipped,
  });

  console.dir(
    await prisma.senderIdentity.findMany({
      include: {
        providerRegistrations: {
          include: {
            provider: true,
          },
        },
      },
    }),
    { depth: null },
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });