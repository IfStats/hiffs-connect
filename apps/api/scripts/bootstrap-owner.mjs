import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const {
  DATABASE_URL,
  BOOTSTRAP_EMAIL,
  BOOTSTRAP_PASSWORD,
  BOOTSTRAP_BUSINESS_ID,
} = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

if (!BOOTSTRAP_EMAIL) {
  throw new Error('BOOTSTRAP_EMAIL is not configured');
}

if (!BOOTSTRAP_PASSWORD) {
  throw new Error('BOOTSTRAP_PASSWORD is not configured');
}

if (!BOOTSTRAP_BUSINESS_ID) {
  throw new Error('BOOTSTRAP_BUSINESS_ID is not configured');
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const business =
    await prisma.business.findUnique({
      where: {
        id: BOOTSTRAP_BUSINESS_ID,
      },
    });

  if (!business) {
    throw new Error('Bootstrap business not found');
  }

  const email =
    BOOTSTRAP_EMAIL.trim().toLowerCase();

  const passwordHash =
    await bcrypt.hash(
      BOOTSTRAP_PASSWORD,
      12,
    );

  const user =
    await prisma.user.upsert({
      where: {
        email,
      },

      update: {
        passwordHash,
      },

      create: {
        email,
        passwordHash,
      },
    });

  const membership =
    await prisma.businessMembership.upsert({
      where: {
        userId_businessId: {
          userId: user.id,
          businessId:
            BOOTSTRAP_BUSINESS_ID,
        },
      },

      update: {
        role: 'OWNER',
        active: true,
      },

      create: {
        userId: user.id,
        businessId:
          BOOTSTRAP_BUSINESS_ID,
        role: 'OWNER',
        active: true,
      },
    });

  console.log({
    userId: user.id,
    email: user.email,
    businessId:
      membership.businessId,
    role: membership.role,
    active: membership.active,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });