import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
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

async function main() {
  console.log("🌱 Starting seeding process...");

  try {
    await seedRoles();
    await seedUsers();

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
