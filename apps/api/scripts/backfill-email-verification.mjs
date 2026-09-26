import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not configured',
  );
}

const apply =
  process.argv.includes('--apply');

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const users =
    await prisma.user.findMany({
      where: {
        emailVerified: null,
      },

      orderBy: {
        createdAt: 'asc',
      },

      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        createdAt: true,
      },
    });

  console.table(users);

  console.log(
    `Unverified existing users: ${users.length}`,
  );

  if (!apply) {
    console.log(
      'Dry run only. Re-run with --apply to mark these existing accounts as verified.',
    );

    return;
  }

  if (users.length === 0) {
    console.log(
      'Nothing to backfill.',
    );

    return;
  }

  const verifiedAt =
    new Date();

  const userIds =
    users.map(
      (user) => user.id,
    );

  const [
    updatedUsers,
    deletedTokens,
  ] =
    await prisma.$transaction([
      prisma.user.updateMany({
        where: {
          id: {
            in: userIds,
          },

          emailVerified: null,
        },

        data: {
          emailVerified:
            verifiedAt,
        },
      }),

      prisma.emailVerificationToken.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      }),
    ]);

  console.log({
    verifiedUsers:
      updatedUsers.count,

    removedVerificationTokens:
      deletedTokens.count,

    verifiedAt,
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