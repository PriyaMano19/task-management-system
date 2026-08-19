import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPermissions() {
  const permissions = [
    // ============================================================
    // USER
    // ============================================================
    {
      module: "USER",
      action: "CREATE",
      name: "user:create",
      description: "Create users",
    },
    {
      module: "USER",
      action: "VIEW",
      name: "user:view",
      description: "View users",
    },
    {
      module: "USER",
      action: "UPDATE",
      name: "user:update",
      description: "Update users",
    },
    {
      module: "USER",
      action: "DELETE",
      name: "user:delete",
      description: "Delete users",
    },

    // ============================================================
    // ROLE
    // ============================================================
    {
      module: "ROLE",
      action: "CREATE",
      name: "role:create",
      description: "Create roles",
    },
    {
      module: "ROLE",
      action: "VIEW",
      name: "role:view",
      description: "View roles",
    },
    {
      module: "ROLE",
      action: "UPDATE",
      name: "role:update",
      description: "Update roles and permissions",
    },
    {
      module: "ROLE",
      action: "DELETE",
      name: "role:delete",
      description: "Delete roles",
    },

    // ============================================================
    // PROJECT
    // ============================================================
    {
      module: "PROJECT",
      action: "CREATE",
      name: "project:create",
      description: "Create projects",
    },
    {
      module: "PROJECT",
      action: "VIEW",
      name: "project:view",
      description: "View projects",
    },
    {
      module: "PROJECT",
      action: "UPDATE",
      name: "project:update",
      description: "Update projects",
    },
    {
      module: "PROJECT",
      action: "DELETE",
      name: "project:delete",
      description: "Delete projects",
    },

    // ============================================================
    // PROJECT MEMBER
    // ============================================================
    {
      module: "PROJECT_MEMBER",
      action: "VIEW",
      name: "project_member:view",
      description: "View project members",
    },
    {
      module: "PROJECT_MEMBER",
      action: "ADD",
      name: "project_member:add",
      description: "Add project members",
    },
    {
      module: "PROJECT_MEMBER",
      action: "REMOVE",
      name: "project_member:remove",
      description: "Remove project members",
    },

    // ============================================================
    // FOLDER
    // ============================================================
    {
      module: "FOLDER",
      action: "CREATE",
      name: "folder:create",
      description: "Create folders",
    },
    {
      module: "FOLDER",
      action: "VIEW",
      name: "folder:view",
      description: "View folders",
    },
    {
      module: "FOLDER",
      action: "UPDATE",
      name: "folder:update",
      description: "Update folders",
    },
    {
      module: "FOLDER",
      action: "DELETE",
      name: "folder:delete",
      description: "Delete folders",
    },

    // ============================================================
    // TASK
    // ============================================================
    {
      module: "TASK",
      action: "CREATE",
      name: "task:create",
      description: "Create tasks",
    },
    {
      module: "TASK",
      action: "VIEW",
      name: "task:view",
      description: "View tasks",
    },
    {
      module: "TASK",
      action: "UPDATE",
      name: "task:update",
      description: "Update tasks",
    },
    {
      module: "TASK",
      action: "DELETE",
      name: "task:delete",
      description: "Delete tasks",
    },
    {
      module: "TASK",
      action: "ASSIGN",
      name: "task:assign",
      description: "Assign tasks",
    },

    // ============================================================
    // TASK COMMENT
    // ============================================================
    {
      module: "TASK_COMMENT",
      action: "CREATE",
      name: "task_comment:create",
      description: "Add task comments",
    },
    {
      module: "TASK_COMMENT",
      action: "UPDATE",
      name: "task_comment:update",
      description: "Update own task comments",
    },
    {
      module: "TASK_COMMENT",
      action: "DELETE",
      name: "task_comment:delete",
      description: "Delete own task comments",
    },

    // ============================================================
    // ATTACHMENT
    // ============================================================
    {
      module: "TASK_ATTACHMENT",
      action: "UPLOAD",
      name: "task_attachment:upload",
      description: "Upload task attachments",
    },
    {
      module: "TASK_ATTACHMENT",
      action: "VIEW",
      name: "task_attachment:view",
      description: "View task attachments",
    },
    {
      module: "TASK_ATTACHMENT",
      action: "DELETE",
      name: "task_attachment:delete",
      description: "Delete task attachments",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {
        description: permission.description,
      },
      create: permission,
    });
  }

  console.log("✅ Permissions seeded");
}