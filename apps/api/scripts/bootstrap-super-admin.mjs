import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const {
  DATABASE_URL,
  SUPER_ADMIN_EMAIL,
} = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured');
}

if (!SUPER_ADMIN_EMAIL) {
  throw new Error('SUPER_ADMIN_EMAIL is not configured');
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const email =
    SUPER_ADMIN_EMAIL.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('Super admin user not found');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      platformRole: 'SUPER_ADMIN',
    },

    select: {
      id: true,
      email: true,
      platformRole: true,
    },
  });

  console.log(updatedUser);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });