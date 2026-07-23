import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPermissions() {
  const permissions = [
    {
      module: "USER",
      action: "CREATE",
      name: "user:create",
    },
    {
      module: "USER",
      action: "UPDATE",
      name: "user:update",
    },
    {
      module: "USER",
      action: "DELETE",
      name: "user:delete",
    },
    {
      module: "USER",
      action: "VIEW",
      name: "user:view",
    },

    {
      module: "TASK",
      action: "CREATE",
      name: "task:create",
    },
    {
      module: "TASK",
      action: "UPDATE",
      name: "task:update",
    },
    {
      module: "TASK",
      action: "DELETE",
      name: "task:delete",
    },
    {
      module: "TASK",
      action: "VIEW",
      name: "task:view",
    },
    {
      module: "TASK",
      action: "ASSIGN",
      name: "task:assign",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {},
      create: permission,
    });
  }

  console.log("✅ Permissions seeded");
}