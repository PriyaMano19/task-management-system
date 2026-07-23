import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function seedAdmin() {
  const adminRole = await prisma.role.findUnique({
    where: {
      name: "Admin",
    },
  });

  if (!adminRole) {
    throw new Error("Admin role not found");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: "priyanthi.ra@iphonik.com",
    },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  await prisma.user.create({
    data: {
      firstName: "Priya",
      lastName: "Mano",
      email: "priyanthi.ra@iphonik.com",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log("✅ Admin user created");
}