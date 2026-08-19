import { AppError } from "../../shared/errors/AppError";
import { projectRepository } from "./project.repository";
import { projectMemberRepository } from "./projectMember.repository";

class ProjectAccessService {

  async validateProject(projectId: string) {
    const project =
      await projectRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        "Project not found.",
        404
      );
    }

    return project;
  }


  async validateProjectMember(
    projectId: string,
    userId: string
  ) {

    await this.validateProject(projectId);

    const member =
      await projectMemberRepository.findMember(
        projectId,
        userId
      );

    if (!member) {
      throw new AppError(
        "You are not a member of this project.",
        403
      );
    }

    return member;
  }



  async validateProjectAccess(
    projectId: string,
    userId: string
  ) {

    const member =
      await this.validateProjectMember(
        projectId,
        userId
      );

    return member;
  }
}

export const projectAccessService =
  new ProjectAccessService();