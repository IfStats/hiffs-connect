import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

const OLD_EMAIL = 'contact@hiffsglobal.com';
const NEW_EMAIL = 'hello@hiffsglobal.com';

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const existingNewEmail = await prisma.user.findUnique({
    where: {
      email: NEW_EMAIL,
    },
  });

  if (existingNewEmail) {
    throw new Error(
      `${NEW_EMAIL} already exists. No migration performed.`,
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: OLD_EMAIL,
    },

    include: {
      memberships: {
        include: {
          business: true,
        },
      },
    },
  });

  if (!existingUser) {
    throw new Error(`${OLD_EMAIL} was not found`);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },

    data: {
      email: NEW_EMAIL,
      platformRole: 'SUPER_ADMIN',
    },

    include: {
      memberships: {
        include: {
          business: true,
        },
      },
    },
  });

  console.log({
    id: updatedUser.id,
    email: updatedUser.email,
    platformRole: updatedUser.platformRole,

    memberships: updatedUser.memberships.map((membership) => ({
      businessId: membership.businessId,
      businessName: membership.business.name,
      role: membership.role,
      active: membership.active,
    })),
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