import { Inventory, PrismaClient, EndUser, Issuance } from "@prisma/client";
import argon2 from "argon2";
import {faker} from '@faker-js/faker';
import { Decimal } from "@prisma/client/runtime/library";
const prisma = new PrismaClient();

async function seedRoles() {
  console.log("📑 Seeding roles...");
  const roles = await prisma.role.createMany({
    data: [
      {
        name: "superadmin",
        permissions: [],
        description: "Can do anything",
      },
      {
        name: "admin",
        permissions: [],
        description: "basic admin",
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${roles.count} roles`);
  return roles;
}

async function seedUsers() {
  console.log("👥 Seeding users...");
  const adminRole = await prisma.role.findUnique({
    where: { name: "admin" },
  });

  const superadminRole = await prisma.role.findUnique({
    where: { name: "superadmin" },
  });

  if (!adminRole || !superadminRole) {
    throw new Error("Required roles not found");
  }

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "superadmin@wisce.com" },
      update: {},
      create: {
        firstname: "Gil",
        lastname: "Zaballero",
        password: await argon2.hash("password123"),
        roles: {
          connect: { id: superadminRole.id },
        },
        email: "superadmin@wisce.com",
        username: "superadmin",
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@wisce.com" },
      update: {},
      create: {
        firstname: "Glenn",
        lastname: "Pacturan",
        password: await argon2.hash("password123"),
        roles: {
          connect: { id: adminRole.id },
        },
        email: "admin@wisce.com",
        username: "admin",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function seedEndUsers() {
  console.log("👤 Seeding end users...");
  const endUsers: EndUser[] = [];

  const endUserNames = ['FSPI', 'CAFGU', 'ANGBU'];

  for (let i = 0; i < endUserNames.length; i++) {
    endUsers.push(await prisma.endUser.create({
      data: {
        name: endUserNames[i],
      },
    }));
  }

  console.log(`✅ Created ${endUsers.length} end users`);
  return endUsers;
}

async function seedInventory() {
  console.log("📦 Seeding inventory...");
  const inventoryItems: Inventory[] = [];

  for (let i = 0; i < 5; i++) {
    const quantity = faker.number.int({ min: 10, max: 100 });
    const price = parseFloat(faker.commerce.price({ min: 100, max: 1000 }));
    
    inventoryItems.push({
          id: faker.string.uuid(),
          itemName: faker.commerce.productName(),
          location: faker.location.city(),
          supplier: faker.company.name(),
          quantity: quantity,
          price: new Decimal(price),
          amount: new Decimal(quantity * price),
          size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL', null]),
          status: faker.helpers.arrayElement(['active', 'archived']),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent(),
          endUserId: null,
        });
  }

  const inventory = await prisma.inventory.createMany({
    data: inventoryItems,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${inventory.count} inventory items`);
  return inventory;
}

async function seedIssuance() {
  console.log("📝 Seeding issuances...");
  
  // Get existing users and inventory items
  const users = await prisma.user.findMany();
  const inventoryItems = await prisma.inventory.findMany();
  const endUsers = await prisma.endUser.findMany();

  const issuances: Issuance[] = [];

  for (let i = 0; i < 5; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const randomEndUser = faker.helpers.arrayElement(endUsers);
    
    issuances.push(await prisma.issuance.create({
      data: {
        userId: randomUser.id,
        directiveNo: faker.string.alphanumeric(8).toUpperCase(),
        issuanceDate: faker.date.recent(),
        expiryDate: faker.date.future(),
        documentNum: faker.string.alphanumeric(10).toUpperCase(),
        endUserId: randomEndUser.id,
        status: faker.helpers.arrayElement(['pending', 'withdrawn', 'archived']),
        inventoryItems: {
          connect: faker.helpers.arrayElements(inventoryItems, { min: 1, max: 3 }).map(item => ({ id: item.id })),
        },
      },
    }));
  }

  console.log(`✅ Created ${issuances.length} issuances`);
  return issuances;
}

async function main() {
  console.log("🌱 Starting seeding process...");

  try {
    await seedRoles();
    await seedUsers();
    await seedEndUsers();
    await seedInventory();
    await seedIssuance();

    console.log("✅ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
