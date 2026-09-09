import { PrismaClient } from '@egaps/db';
import bcrypt from 'bcrypt';

const loginId = process.env.SEED_ADMIN_LOGIN_ID ?? 'admin';
const password = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_FULL_NAME ?? 'System Administrator';

if (!password) {
  console.error('SEED_ADMIN_PASSWORD env var is required.');
  process.exit(1);
}

const prisma = new PrismaClient();

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { loginId },
  update: { passwordHash, fullName, active: true },
  create: { loginId, passwordHash, fullName, active: true },
});

console.log(`Seeded admin user "${user.loginId}" (id: ${user.id})`);

await prisma.$disconnect();
