import prisma from "../../database/prisma";

class DashboardRepository {


  async getGlobalDashboard() {
    const [
      projectCounts,
      taskCounts,
      memberCount,
      projects,
    ] = await Promise.all([
      prisma.project.groupBy({
        by: ["status"],

        _count: {
          _all: true,
        },
      }),

      prisma.task.groupBy({
        by: ["status"],

        _count: {
          _all: true,
        },
      }),

      prisma.projectMember.findMany({
        select: {
          userId: true,
        },

        distinct: ["userId"],
      }),

      prisma.project.findMany({
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


  async getMyDashboard(userId: string) {
    const now = new Date();

    const [
      projects,
      taskCounts,
      assignedTasks,
      upcomingTasks,
      overdueCount,
    ] = await Promise.all([

    
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

   
      prisma.task.groupBy({
        by: ["status"],

        where: {
          assignedToId: userId,
        },

        _count: {
          _all: true,
        },
      }),

      // --------------------------------------------------------
      // MY ASSIGNED TASKS
      // --------------------------------------------------------

      prisma.task.findMany({
        where: {
          assignedToId: userId,
        },

        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,

          folder: {
            select: {
              id: true,
              name: true,

              project: {
                select: {
                  id: true,
                  companyName: true,
                  projectName: true,
                },
              },
            },
          },

          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },

        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 10,
      }),

      // --------------------------------------------------------
      // UPCOMING DEADLINES
      // --------------------------------------------------------

      prisma.task.findMany({
        where: {
          assignedToId: userId,

          dueDate: {
            gte: now,
          },

          status: {
            not: "DONE",
          },
        },

        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,

          folder: {
            select: {
              name: true,

              project: {
                select: {
                  id: true,
                  projectName: true,
                  companyName: true,
                },
              },
            },
          },
        },

        orderBy: {
          dueDate: "asc",
        },

        take: 5,
      }),

  
      prisma.task.count({
        where: {
          assignedToId: userId,

          dueDate: {
            lt: now,
          },

          status: {
            not: "DONE",
          },
        },
      }),
    ]);

    return {
      projects,
      taskCounts,
      assignedTasks,
      upcomingTasks,
      overdueCount,
    };
  }
}

export const dashboardRepository =
  new DashboardRepository();