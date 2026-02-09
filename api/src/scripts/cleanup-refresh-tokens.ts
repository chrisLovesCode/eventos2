import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { not: null, lt: revokedBefore } },
      ],
    },
  });

  console.log(`Deleted ${deleted.count} refresh tokens.`);
}

main()
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
