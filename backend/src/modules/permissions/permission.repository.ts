import prisma from "../../database/prisma";

class PermissionRepository {
  async findAll() {
    return prisma.permission.findMany({
      select: {
        id: true,
        module: true,
        action: true,
        name: true,
        description: true,
      },
      orderBy: [
        {
          module: "asc",
        },
        {
          action: "asc",
        },
      ],
    });
  }

  async findById(id: string) {
    return prisma.permission.findUnique({
      where: {
        id,
      },
    });
  }

async findRolePermissions(roleId: string) {
  return prisma.rolePermission.findMany({
    where: {
      roleId,
    },
    select: {
      permission: {
        select: {
          id: true,
          module: true,
          action: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      permission: {
        module: "asc",
      },
    },
  });
}

  async replaceRolePermissions(
    roleId: string,
    permissionIds: string[]
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.rolePermission.findMany({
        where: {
          roleId,
        },
        select: {
          permissionId: true,
        },
      });
    });
  }
}

export const permissionRepository =
  new PermissionRepository();