import prisma from "../../database/prisma";

class ProjectDashboardRepository {

  async getDashboard(projectId: string) {
    const [
      project,
      memberCount,
      folderCount,
      taskCounts,
    ] = await Promise.all([

      // Project
      prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
          companyName: true,
          projectName: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Members
      prisma.projectMember.count({
        where: {
          projectId,
        },
      }),

      // Folders
      prisma.projectFolder.count({
        where: {
          projectId,
        },
      }),

      // Tasks grouped by status
      prisma.task.groupBy({
        by: ["status"],
        where: {
          folder: {
            projectId,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      project,
      memberCount,
      folderCount,
      taskCounts,
    };
  }
}

export const projectDashboardRepository =
  new ProjectDashboardRepository();