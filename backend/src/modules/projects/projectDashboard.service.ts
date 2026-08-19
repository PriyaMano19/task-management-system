import { AppError } from "../../shared/errors/AppError";

import { projectDashboardRepository } from "./projectDashboard.repository";
import { projectAccessService } from "./projectAccess.service";

class ProjectDashboardService {

  async getDashboard(
    projectId: string,
    userId: string
  ) {

    // User must belong to the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    const dashboard =
      await projectDashboardRepository.getDashboard(
        projectId
      );

    if (!dashboard.project) {
      throw new AppError(
        "Project not found.",
        404
      );
    }

    const todo =
      dashboard.taskCounts.find(
        (item) => item.status === "TODO"
      )?._count._all ?? 0;

    const inProgress =
      dashboard.taskCounts.find(
        (item) => item.status === "IN_PROGRESS"
      )?._count._all ?? 0;

    const done =
      dashboard.taskCounts.find(
        (item) => item.status === "DONE"
      )?._count._all ?? 0;

    const total =
      todo +
      inProgress +
      done;

    return {
      project: dashboard.project,

      statistics: {
        members: dashboard.memberCount,
        folders: dashboard.folderCount,

        tasks: {
          total,
          todo,
          inProgress,
          done,
        },
      },
    };
  }
}

export const projectDashboardService =
  new ProjectDashboardService();