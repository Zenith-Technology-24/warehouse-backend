import { EndUser, Inventory, PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { faker } from "@faker-js/faker";
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

  const endUserNames = ["FSPI", "CAFGU", "ANGBU", "PNP", "AFP"];

  for (const name of endUserNames) {
    endUsers.push(
      await prisma.endUser.create({
        data: {
          name: name,
        },
      })
    );
  }

  console.log(`✅ Created ${endUsers.length} end users`);
  return endUsers;
}

async function seedReceipts() {
  console.log("📝 Seeding receipts...");
  const receipts = [];
  const inventoryItems = await prisma.inventory.findMany();

  for (let i = 0; i < 5; i++) {
    const receipt = await prisma.receipt.create({
      data: {
        directiveNo: faker.string.alphanumeric(8).toUpperCase(),
        receiptDate: faker.date.recent(),
      },
    });

    // Create InventoryReceipt entries
    const selectedItems = faker.helpers.arrayElements(inventoryItems, {
      min: 1,
      max: 3,
    });

    for (const item of selectedItems) {
      await prisma.inventoryReceipt.create({
        data: {
          receiptId: receipt.id,
          inventoryId: item.id,
          quantity: faker.number.int({ min: 1, max: 50 }),
        },
      });
    }

    receipts.push(receipt as never);
  }

  console.log(`✅ Created ${receipts.length} receipts with inventory items`);
  return receipts;
}

async function seedIssuance() {
  console.log("📝 Seeding issuances...");

  const users = await prisma.user.findMany();
  const inventoryItems = await prisma.inventory.findMany();
  const endUsers = await prisma.endUser.findMany();
  const receipts = await prisma.receipt.findMany();

  for (let i = 0; i < 5; i++) {
    const randomUser = faker.helpers.arrayElement(users);

    // Create issuance
    const issuance = await prisma.issuance.create({
      data: {
        userId: randomUser.id,
        directiveNo: faker.string.alphanumeric(8).toUpperCase(),
        issuanceDate: faker.date.recent(),
        expiryDate: faker.date.future(),
        documentNum: faker.string.alphanumeric(10).toUpperCase(),
        status: faker.helpers.arrayElement(["pending", "withdrawn", "archived"]),
      },
    });

    // Link issuance to receipts
    const selectedReceipts = faker.helpers.arrayElements(receipts, {
      min: 1,
      max: 2,
    });

    for (const receipt of selectedReceipts) {
      await prisma.issuanceReceipt.create({
        data: {
          issuanceId: issuance.id,
          receiptId: receipt.id,
        },
      });
    }

    // Create IssuanceEndUser entries
    const selectedEndUsers = faker.helpers.arrayElements(endUsers, {
      min: 1,
      max: 3,
    });

    for (const endUser of selectedEndUsers) {
      const issuanceEndUser = await prisma.issuanceEndUser.create({
        data: {
          issuanceId: issuance.id,
          endUserId: endUser.id,
        },
      });

      // Create IssuanceEndUserItem entries
      const selectedItems = faker.helpers.arrayElements(inventoryItems, {
        min: 1,
        max: 5,
      });

      for (const item of selectedItems) {
        await prisma.issuanceEndUserItem.create({
          data: {
            issuanceEndUserId: issuanceEndUser.id,
            inventoryId: item.id,
            quantity: faker.number.int({ min: 1, max: 10 }),
          },
        });
      }
    }
  }

  console.log(`✅ Created 5 issuances with related records`);
}


async function seedItemTypes() {
  console.log("📦 Seeding item types...");
  const itemTypes = await prisma.itemType.createMany({
    data: [
      {
        name: "Uniform",
        sizeType: "apparel",
      },
      {
        name: "Equipment",
        sizeType: "none",
      },
      {
        name: "Footwear",
        sizeType: "numerical",
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${itemTypes.count} item types`);
  return itemTypes;
}

async function seedInventory() {
  console.log("📦 Seeding inventory...");
  const inventoryItems: Inventory[] = [];

  // Get all item types
  const itemTypes = await prisma.itemType.findMany();
  if (!itemTypes.length) {
    throw new Error("No item types found. Please seed item types first.");
  }

  for (let i = 0; i < 10; i++) {
    const randomItemType = faker.helpers.arrayElement(itemTypes);
    const quantity = faker.number.int({ min: 10, max: 100 });
    const price = parseFloat(faker.commerce.price({ min: 100, max: 1000 }));

    // Set size based on item type's sizeType
    let size: string | null = null;
    if (randomItemType.sizeType === "apparel") {
      size = faker.helpers.arrayElement(["XS", "S", "M", "L", "XL"]);
    } else if (randomItemType.sizeType === "numerical") {
      size = faker.helpers.arrayElement(["7", "8", "9", "10", "11"]);
    }

    inventoryItems.push(
      await prisma.inventory.create({
        data: {
          itemName: faker.commerce.productName(),
          location: faker.location.city(),
          supplier: faker.company.name(),
          quantity: quantity,
          price: new Decimal(price),
          amount: new Decimal(quantity * price),
          unit: faker.helpers.arrayElement(["prs", "ea", "sets"]),
          size: size,
          status: faker.helpers.arrayElement(["active", "archived"]),
          itemTypeId: randomItemType.id,
        },
      })
    );
  }

  console.log(`✅ Created ${inventoryItems.length} inventory items`);
  return inventoryItems;
}

async function main() {
  console.log("🌱 Starting seeding process...");

  try {
    await seedRoles();
    await seedUsers();
    await seedEndUsers();
    await seedItemTypes();
    await seedInventory();
    await seedReceipts();
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
