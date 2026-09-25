import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_INDIAN_CATEGORIES } from '../src/config/constants';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding initial data for Aura Expense...');

  // Create global default categories
  for (const cat of DEFAULT_INDIAN_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          colorHex: cat.colorHex,
          type: cat.type,
          isDefault: true,
          userId: null,
        },
      });
    }
  }

  // Create demo user for local testing if not present
  const demoEmail = 'user@example.com';
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!demoUser) {
    const passwordHash = await bcrypt.hash('password123', 12);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: 'Arun Kumar',
        currency: 'INR',
      },
    });

    // Create demo accounts
    const hdfc = await prisma.account.create({
      data: {
        userId: demoUser.id,
        institutionName: 'HDFC Bank',
        accountType: 'SAVINGS',
        maskLastFour: '1234',
        balance: 45210.50,
      },
    });

    const sbi = await prisma.account.create({
      data: {
        userId: demoUser.id,
        institutionName: 'State Bank of India',
        accountType: 'SAVINGS',
        maskLastFour: '9876',
        balance: 18420.00,
      },
    });

    const iciciCard = await prisma.account.create({
      data: {
        userId: demoUser.id,
        institutionName: 'ICICI Credit Card',
        accountType: 'CREDIT_CARD',
        maskLastFour: '4444',
      },
    });

    // Create demo budget
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.budget.create({
      data: {
        userId: demoUser.id,
        monthYear: currentMonth,
        totalLimit: 30000,
      },
    });

    console.log(`Demo user created: ${demoEmail} / password123`);
  }

  console.log('Database seeding complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
