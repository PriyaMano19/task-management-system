import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedRoles() {
  const roles = [
    {
      name: "Admin",
      description: "System Administrator",
    },
    {
      name: "Project Manager",
      description: "Project Manager",
    },
    {
      name: "Team Lead",
      description: "Team Lead",
    },
    {
      name: "Developer",
      description: "Developer",
    },
    {
      name: "QA Engineer",
      description: "Quality Assurance Engineer",
    },
    {
      name: "Viewer",
      description: "Read Only User",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log("✅ Roles seeded");
}