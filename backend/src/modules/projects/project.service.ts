import { projectRepository } from "./project.repository";
import { CreateProjectDto,GetProjectsQuery,UpdateProjectDto } from "./project.types";
import { AppError } from "../../shared/errors/AppError";
import { projectMemberRepository } from "./projectMember.repository";
class ProjectService {
  async createProject(
    data: CreateProjectDto,
    createdById: string
  ) {
    const existingProject =
      await projectRepository.findByCompanyAndProjectName(
        data.companyName,
        data.projectName
      );

    if (existingProject) {
      throw new Error(
        "Project already exists for this company."
      );
    }

    return projectRepository.create(
      data,
      createdById
    );
  }
  async getProjects(query: GetProjectsQuery) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const [projects, total] = await Promise.all([
    projectRepository.findAll({
      ...query,
      page,
      limit,
    }),

    projectRepository.count(query),
  ]);

  return {
    data: projects,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
async getProjectById(id: string) {
  const project = await projectRepository.findById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}
async updateProject(id: string, data: UpdateProjectDto) {
  const project = await projectRepository.findById(id);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (data.companyName && data.projectName) {
    const existing = await projectRepository.findByCompanyAndProjectName(
      data.companyName,
      data.projectName
    );

    if (existing && existing.id !== id) {
      throw new AppError(
        "A project with this company and project name already exists.",
        409
      );
    }
  }

  return projectRepository.update(id, data);
}
async deleteProject(id: string) {
  const project = await projectRepository.findById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  await projectRepository.delete(id);
}
async addMember(
  projectId: string,
  userId: string,
  roleId: string
) {
  // Check project exists
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  // Check if the user is already assigned to this project
  const existingMember = await projectMemberRepository.findMember(
    projectId,
    userId
  );

  if (existingMember) {
    throw new AppError(
      "User is already a member of this project.",
      409
    );
  }

  // Add the member
  return projectMemberRepository.addMember(
    projectId,
    userId,
    roleId
  );
}
async getProjectMembers(projectId: string) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  return projectMemberRepository.findMembers(projectId);
}
async removeMember(
  projectId: string,
  userId: string
) {
  const member = await projectMemberRepository.findMember(
    projectId,
    userId
  );

  if (!member) {
    throw new Error("Project member not found.");
  }

  await projectMemberRepository.removeMember(
    projectId,
    userId
  );
}
}

export const projectService = new ProjectService();