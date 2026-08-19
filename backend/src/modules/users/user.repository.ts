import prisma from "../../database/prisma";
import {
  CreateUserDto,
  UpdateUserDto,
} from "./user.types";
class UserRepository {
  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: [
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }


  async findByIdWithPassword(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }


  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }


  async create(
    data: CreateUserDto & {
      password: string;
    }
  ) {
    return prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
        status: data.status ?? "ACTIVE",
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
    });
  }

 
  async update(
    id: string,
    data: UpdateUserDto & {
      password?: string;
    }
  ) {
    return prisma.user.update({
      where: {
        id,
      },

      data,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
    });
  }


  async delete(id: string) {
    return prisma.user.delete({
      where: {
        id,
      },
    });
  }


  async getDependencyCounts(id: string) {
    const [
      assignedTasks,
      createdTasks,
      createdProjects,
      createdFolders,
      comments,
      attachments,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          assignedToId: id,
        },
      }),

      prisma.task.count({
        where: {
          createdById: id,
        },
      }),

      prisma.project.count({
        where: {
          createdById: id,
        },
      }),

      prisma.projectFolder.count({
        where: {
          createdById: id,
        },
      }),

      prisma.taskComment.count({
        where: {
          userId: id,
        },
      }),

      prisma.taskAttachment.count({
        where: {
          uploadedById: id,
        },
      }),
    ]);

    return {
      assignedTasks,
      createdTasks,
      createdProjects,
      createdFolders,
      comments,
      attachments,
    };
  }
}

export const userRepository =
  new UserRepository();