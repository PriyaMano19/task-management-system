import prisma from "../../database/prisma";

class ProjectMemberRepository {
  async addMember(
    projectId: string,
    userId: string,
    roleId: string
  ) {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findMember(
    projectId: string,
    userId: string
  ) {
    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async removeMember(
    projectId: string,
    userId: string
  ) {
    return prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async countMembers(projectId: string) {
    return prisma.projectMember.count({
      where: {
        projectId,
      },
    });
  }
}

export const projectMemberRepository = new ProjectMemberRepository();