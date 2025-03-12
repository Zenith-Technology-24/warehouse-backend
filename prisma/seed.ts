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

async function main() {
  console.log("🌱 Starting seeding process...");

  try {
    await seedRoles();
    await seedUsers();

    // await prisma.issuance.deleteMany();

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
