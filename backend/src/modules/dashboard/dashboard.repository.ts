import prisma from "../../database/prisma";

class DashboardRepository {

  async getGlobalDashboard(userId: string) {

    const [
      projectCounts,
      taskCounts,
      memberCount,
      projects,
    ] = await Promise.all([

   
      prisma.project.groupBy({
        by: ["status"],
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        _count: {
          _all: true,
        },
      }),

   
      prisma.task.groupBy({
        by: ["status"],
        where: {
          folder: {
            project: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
        _count: {
          _all: true,
        },
      }),

  
      prisma.projectMember.findMany({
        where: {
          project: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      }),

  
      prisma.project.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },

        select: {
          id: true,
          companyName: true,
          projectName: true,
          status: true,

          _count: {
            select: {
              members: true,
              folders: true,
            },
          },

          folders: {
            select: {
              _count: {
                select: {
                  tasks: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      projectCounts,
      taskCounts,
      memberCount,
      projects,
    };
  }
}

export const dashboardRepository =
  new DashboardRepository();