import { AppError } from "../../shared/errors/AppError";
import { projectRepository } from "../projects/project.repository";
import { projectFolderRepository } from "./projectFolder.repository";
import {
  CreateProjectFolderDto,
  UpdateProjectFolderDto,
} from "./projectFolder.types";

class ProjectFolderService {
  async createFolder(
    projectId: string,
    createdById: string,
    data: CreateProjectFolderDto
  ) {
    // Check project exists
    const project = await projectRepository.findById(
      projectId
    );

    if (!project) {
      throw new AppError(
        "Project not found.",
        404
      );
    }

    // Prevent duplicate folder names within project
    const existingFolder =
      await projectFolderRepository.findByName(
        projectId,
        data.name
      );

    if (existingFolder) {
      throw new AppError(
        "A folder with this name already exists in this project.",
        409
      );
    }

    return projectFolderRepository.create(
      projectId,
      createdById,
      data
    );
  }

  async getFolders(projectId: string) {
    const project = await projectRepository.findById(
      projectId
    );

    if (!project) {
      throw new AppError(
        "Project not found.",
        404
      );
    }

    return projectFolderRepository.findAll(
      projectId
    );
  }

  async getFolderById(
    projectId: string,
    folderId: string
  ) {
    const folder =
      await projectFolderRepository.findById(
        projectId,
        folderId
      );

    if (!folder) {
      throw new AppError(
        "Folder not found.",
        404
      );
    }

    return folder;
  }

  async updateFolder(
    projectId: string,
    folderId: string,
    data: UpdateProjectFolderDto
  ) {
    const folder =
      await projectFolderRepository.findById(
        projectId,
        folderId
      );

    if (!folder) {
      throw new AppError(
        "Folder not found.",
        404
      );
    }

    if (data.name) {
      const existingFolder =
        await projectFolderRepository.findByName(
          projectId,
          data.name
        );

      if (
        existingFolder &&
        existingFolder.id !== folderId
      ) {
        throw new AppError(
          "A folder with this name already exists in this project.",
          409
        );
      }
    }

    return projectFolderRepository.update(
      folderId,
      data
    );
  }

  async deleteFolder(
    projectId: string,
    folderId: string
  ) {
    const folder =
      await projectFolderRepository.findById(
        projectId,
        folderId
      );

    if (!folder) {
      throw new AppError(
        "Folder not found.",
        404
      );
    }

    await projectFolderRepository.delete(
      folderId
    );
  }
}

export const projectFolderService =
  new ProjectFolderService();