import { PrismaClient, Role, TransactionType, RecurrenceFrequency } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: Buffer.from("admin123").toString("base64"),
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: Buffer.from("demo1234").toString("base64"),
      role: Role.USER,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create categories for demo user
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name_userId: { name: "Food & Dining", userId: demoUser.id } },
      update: {},
      create: { name: "Food & Dining", color: "#ef4444", icon: "🍔", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Transportation", userId: demoUser.id } },
      update: {},
      create: { name: "Transportation", color: "#f97316", icon: "🚗", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Shopping", userId: demoUser.id } },
      update: {},
      create: { name: "Shopping", color: "#eab308", icon: "🛒", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Entertainment", userId: demoUser.id } },
      update: {},
      create: { name: "Entertainment", color: "#22c55e", icon: "🎬", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Bills & Utilities", userId: demoUser.id } },
      update: {},
      create: { name: "Bills & Utilities", color: "#3b82f6", icon: "💡", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Health", userId: demoUser.id } },
      update: {},
      create: { name: "Health", color: "#ec4899", icon: "🏥", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Salary", userId: demoUser.id } },
      update: {},
      create: { name: "Salary", color: "#10b981", icon: "💰", userId: demoUser.id },
    }),
    prisma.category.upsert({
      where: { name_userId: { name: "Freelance", userId: demoUser.id } },
      update: {},
      create: { name: "Freelance", color: "#6366f1", icon: "💵", userId: demoUser.id },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  const [food, transport, shopping, entertainment, bills, health, salary, freelance] = categories;

  // Create sample transactions
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await Promise.all([
    // Income
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: salary.id,
        amount: 5000,
        type: TransactionType.INCOME,
        description: "Monthly Salary",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: freelance.id,
        amount: 750,
        type: TransactionType.INCOME,
        description: "Website project",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 10),
      },
    }),
    // Expenses
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: food.id,
        amount: 45.50,
        type: TransactionType.EXPENSE,
        description: "Grocery shopping",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 3),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: food.id,
        amount: 28.00,
        type: TransactionType.EXPENSE,
        description: "Restaurant dinner",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 7),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: transport.id,
        amount: 65.00,
        type: TransactionType.EXPENSE,
        description: "Gas",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 5),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: bills.id,
        amount: 120.00,
        type: TransactionType.EXPENSE,
        description: "Electricity bill",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 15),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: entertainment.id,
        amount: 15.99,
        type: TransactionType.EXPENSE,
        description: "Netflix subscription",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: shopping.id,
        amount: 89.99,
        type: TransactionType.EXPENSE,
        description: "New shoes",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 12),
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: health.id,
        amount: 35.00,
        type: TransactionType.EXPENSE,
        description: "Pharmacy",
        date: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 8),
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Create budgets
  const budgets = await Promise.all([
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: demoUser.id,
          categoryId: food.id,
          month: thisMonth.getMonth() + 1,
          year: thisMonth.getFullYear(),
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: food.id,
        amount: 400,
        spent: 73.50,
        month: thisMonth.getMonth() + 1,
        year: thisMonth.getFullYear(),
      },
    }),
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: demoUser.id,
          categoryId: transport.id,
          month: thisMonth.getMonth() + 1,
          year: thisMonth.getFullYear(),
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: transport.id,
        amount: 200,
        spent: 65,
        month: thisMonth.getMonth() + 1,
        year: thisMonth.getFullYear(),
      },
    }),
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: demoUser.id,
          categoryId: entertainment.id,
          month: thisMonth.getMonth() + 1,
          year: thisMonth.getFullYear(),
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: entertainment.id,
        amount: 100,
        spent: 15.99,
        month: thisMonth.getMonth() + 1,
        year: thisMonth.getFullYear(),
      },
    }),
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: demoUser.id,
          categoryId: shopping.id,
          month: thisMonth.getMonth() + 1,
          year: thisMonth.getFullYear(),
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        categoryId: shopping.id,
        amount: 300,
        spent: 89.99,
        month: thisMonth.getMonth() + 1,
        year: thisMonth.getFullYear(),
      },
    }),
  ]);

  console.log(`✅ Created ${budgets.length} budgets`);

  // Create recurring transactions
  const recurrences = await Promise.all([
    prisma.recurrence.create({
      data: {
        userId: demoUser.id,
        categoryId: entertainment.id,
        amount: 15.99,
        type: TransactionType.EXPENSE,
        description: "Netflix subscription",
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        isActive: true,
      },
    }),
    prisma.recurrence.create({
      data: {
        userId: demoUser.id,
        categoryId: bills.id,
        amount: 50.00,
        type: TransactionType.EXPENSE,
        description: "Internet bill",
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: new Date(now.getFullYear(), now.getMonth(), 15),
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        isActive: true,
      },
    }),
    prisma.recurrence.create({
      data: {
        userId: demoUser.id,
        categoryId: salary.id,
        amount: 5000.00,
        type: TransactionType.INCOME,
        description: "Monthly salary",
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${recurrences.length} recurring transactions`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Demo credentials:");
  console.log("   Email: demo@example.com");
  console.log("   Password: demo1234");
  console.log("\n📋 Admin credentials:");
  console.log("   Email: admin@example.com");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

