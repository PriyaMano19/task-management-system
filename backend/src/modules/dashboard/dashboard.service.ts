import { dashboardRepository } from "./dashboard.repository";


class DashboardService {

  async getGlobalDashboard(userId: string) {

    const dashboard =
      await dashboardRepository.getGlobalDashboard(
        userId
      );

  
    const totalProjects =
      dashboard.projectCounts.reduce(
        (sum, item) =>
          sum + item._count._all,
        0
      );

    const planningProjects =
      dashboard.projectCounts.find(
        item => item.status === "PLANNING"
      )?._count._all ?? 0;

    const activeProjects =
      dashboard.projectCounts.find(
        item => item.status === "ACTIVE"
      )?._count._all ?? 0;

    const onHoldProjects =
      dashboard.projectCounts.find(
        item => item.status === "ON_HOLD"
      )?._count._all ?? 0;

    const completedProjects =
      dashboard.projectCounts.find(
        item => item.status === "COMPLETED"
      )?._count._all ?? 0;

    const cancelledProjects =
      dashboard.projectCounts.find(
        item => item.status === "CANCELLED"
      )?._count._all ?? 0;


 
    const totalTasks =
      dashboard.taskCounts.reduce(
        (sum, item) =>
          sum + item._count._all,
        0
      );

    const todoTasks =
      dashboard.taskCounts.find(
        item => item.status === "TODO"
      )?._count._all ?? 0;

    const inProgressTasks =
      dashboard.taskCounts.find(
        item => item.status === "IN_PROGRESS"
      )?._count._all ?? 0;

    const doneTasks =
      dashboard.taskCounts.find(
        item => item.status === "DONE"
      )?._count._all ?? 0;


 
    const projects =
      dashboard.projects.map(project => {

        const totalProjectTasks =
          project.folders.reduce(
            (sum, folder) =>
              sum + folder._count.tasks,
            0
          );

        return {
          id: project.id,

          companyName:
            project.companyName,

          projectName:
            project.projectName,

          status:
            project.status,

          members:
            project._count.members,

          folders:
            project._count.folders,

          tasks:
            totalProjectTasks,
        };
      });


    return {

      summary: {

        projects: {
          total: totalProjects,
          planning: planningProjects,
          active: activeProjects,
          onHold: onHoldProjects,
          completed: completedProjects,
          cancelled: cancelledProjects,
        },

        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          done: doneTasks,
        },

        members:
          dashboard.memberCount.length,
      },

      projects,
    };
  }
}

export const dashboardService =
  new DashboardService();