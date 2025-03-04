import {
  EndUser,
  Inventory,
  Issuance,
  IssuanceDetail,
  Item,
  PrismaClient,
  ProductStatus,
  Receipt,
} from "@prisma/client";
import argon2 from "argon2";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seedRoles() {
  console.log("📑 Seeding roles...");
  const roles = await prisma.role.createMany({
    data: [
      {
        name: "superadmin",
        permissions: ["*"],
        description: "Super Administrator",
      },
      {
        name: "admin",
        permissions: ["read", "write"],
        description: "Administrator",
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Created ${roles.count} roles`);
  return roles;
}

async function seedUsers() {
  console.log("👥 Seeding users...");
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const superadminRole = await prisma.role.findUnique({
    where: { name: "superadmin" },
  });

  if (!adminRole || !superadminRole)
    throw new Error("Required roles not found");

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "superadmin@example.com" },
      update: {},
      create: {
        email: "superadmin@example.com",
        firstname: "Super",
        lastname: "Admin",
        username: "superadmin",
        password: await argon2.hash("password123"),
        roles: { connect: { id: superadminRole.id } },
      },
    }),
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        firstname: "Admin",
        lastname: "User",
        username: "admin",
        password: await argon2.hash("password123"),
        roles: { connect: { id: adminRole.id } },
      },
    }),
    prisma.user.upsert({
      where: { email: "giladmin@example.com" },
      update: {},
      create: {
        email: "giladmin@example.com",
        firstname: "Gil",
        lastname: "Super Admin",
        username: "giladmin",
        password: await argon2.hash("password123"),
        roles: { connect: { id: superadminRole.id } },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);
  return users;
}

async function seedItems() {
  console.log("📝 Seeding items...");
  const items = [];
  for (let i = 0; i < 5; i++) {
    const item = await prisma.item.create({
      data: {
        item_name: faker.commerce.productName(),
        location: faker.location.city(),
        size: faker.helpers.arrayElement([
          "S",
          "M",
          "L",
          "XL",
          "38",
          "40",
          "42",
        ]),
        unit: faker.helpers.arrayElement(["pcs", "box", "kg"]),
        quantity: faker.number.int({ min: 1, max: 100 }).toString(),
        expiryDate: faker.date.future(),
        price: faker.commerce.price(),
        amount: faker.commerce.price(),
      },
    });
    items.push(item as never);
  }

  console.log(`✅ Created ${items.length} items`);
  return items;
}

async function seedInventories(items: Item[], issuances: Issuance[]) {
  console.log("📦 Seeding inventories...");
  const inventories = [];
  
  for (const item of items) {
    const inventory = await prisma.inventory.create({
      data: {
        name: faker.commerce.productName(),
        status: faker.helpers.arrayElement([
          "active",
          "archived",
          "withdrawn",
          "pending",
        ] as ProductStatus[]),
        unit: faker.helpers.arrayElement(["pcs", "box", "kg"]),
        sizeType: faker.helpers.arrayElement(["none", "apparrel", "numerical"]),
        itemId: item.id,
        issuance: {
          connect: {
            id: faker.helpers.arrayElement(issuances).id,
          },
        },
      },
    });
    inventories.push(inventory as never);
  }

  console.log(`✅ Created ${inventories.length} inventories`);
  return inventories;
}

async function seedIssuanceDetails() {
  console.log("📝 Seeding issuance details...");
  const issuanceDetails = [];

  for (let i = 0; i < 3; i++) {
    const issuanceDetail = await prisma.issuanceDetail.create({
      data: {
        quantity: "1",
        issuanceId: faker.string.uuid(),
        status: faker.helpers.arrayElement([
          "active",
          "archived",
          "withdrawn",
          "pending",
        ] as ProductStatus[]),
      },
    });
    issuanceDetails.push(issuanceDetail as never);
  }

  console.log(`✅ Created ${issuanceDetails.length} issuance details`);
  return issuanceDetails;
}

async function seedIssuances(
  endUsers: EndUser[],
  issuanceDetails: IssuanceDetail[]
) {
  console.log("📄 Seeding issuances...");
  const issuances = [];

  for (let i = 0; i < 3; i++) {
    const issuance = await prisma.issuance.create({
      data: {
        issuanceDirective: faker.string.alphanumeric(10),
        validityDate: faker.date.future(),
        status: faker.helpers.arrayElement([
          "withdrawn",
          "pending",
        ] as ProductStatus[]),
        endUsers: {
          connect: [{ id: faker.helpers.arrayElement(endUsers).id }],
        },
        issuanceDetail: {
          connect: { id: faker.helpers.arrayElement(issuanceDetails).id },
        },
      },
    });
    issuances.push(issuance as never);
  }

  console.log(`✅ Created ${issuances.length} issuances`);
  return issuances;
}

async function seedEndUsers() {
  console.log("👥 Seeding end users...");
  const endUsers = [];

  for (let i = 0; i < 3; i++) {
    const endUser = await prisma.endUser.create({
      data: {
        name: faker.company.name(),
      },
    });
    endUsers.push(endUser as never);
  }

  console.log(`✅ Created ${endUsers.length} end users`);
  return endUsers;
}

async function seedReceipts(inventories: Inventory[]) {
  console.log("🧾 Seeding receipts...");
  const receipts = [];

  for (let i = 0; i < 3; i++) {
    const receipt = await prisma.receipt.create({
      data: {
        source: faker.company.name(),
        status: faker.helpers.arrayElement([
          "active",
          "archived",
          "withdrawn",
          "pending",
        ] as ProductStatus[]),
        issuanceDirective: faker.string.alphanumeric(10),
        inventory: {
          connect: [{ id: faker.helpers.arrayElement(inventories).id }],
        },
      },
    });
    receipts.push(receipt as never);
  }

  console.log(`✅ Created ${receipts.length} receipts`);
  return receipts;
}

async function main() {
  console.log("🌱 Starting seeding process...");

  try {
    await seedRoles();
    await seedUsers();
    const endUsers = await seedEndUsers();
    const issuanceDetails = await seedIssuanceDetails();
    const issuances = await seedIssuances(endUsers, issuanceDetails);
    // Create items first
    const items = await seedItems();
    // Create inventories with items and issuances
    const inventories = await seedInventories(items, issuances);
    // Create receipts with inventories
    const receipts = await seedReceipts(inventories);

    console.log("✅ Seeding completed successfully!");
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
