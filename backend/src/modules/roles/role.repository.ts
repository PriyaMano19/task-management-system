import prisma from "../../database/prisma";
import {
  CreateRoleDto,
  UpdateRoleDto,
} from "./role.types";
class RoleRepository {
  async findAll() {
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,

      _count: {
        select: {
          users: true,
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });
}
  async findById(id: string) {
    return prisma.role.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: {
        name,
      },
    });
  }


  async create(
    data: CreateRoleDto
  ) {
    return prisma.role.create({
      data: {
        name: data.name,
        description:
          data.description || null,
      },

      select: {
        id: true,
        name: true,
        description: true,

        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }


  async update(
    id: string,
    data: UpdateRoleDto
  ) {
    return prisma.role.update({
      where: {
        id,
      },

      data,

      select: {
        id: true,
        name: true,
        description: true,

        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }


  async delete(id: string) {
    return prisma.role.delete({
      where: {
        id,
      },
    });
  }


  async getDependencyCounts(
    id: string
  ) {
    const [
      users,
      projectMembers,
      rolePermissions,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          roleId: id,
        },
      }),

      prisma.projectMember.count({
        where: {
          roleId: id,
        },
      }),

      prisma.rolePermission.count({
        where: {
          roleId: id,
        },
      }),
    ]);

    return {
      users,
      projectMembers,
      rolePermissions,
    };
  }
}

export const roleRepository =
  new RoleRepository();