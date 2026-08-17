import { AppError } from "../../shared/errors/AppError";

import { projectFolderRepository } from "./projectFolder.repository";

import { projectAccessService } from "../projects/projectAccess.service";

import {
  CreateProjectFolderDto,
  UpdateProjectFolderDto,
} from "./projectFolder.types";

class ProjectFolderService {

  // ============================================================
  // CREATE FOLDER
  // ============================================================

  async createFolder(
    projectId: string,
    createdById: string,
    data: CreateProjectFolderDto
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      createdById
    );

    // Prevent duplicate folder names
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


  // ============================================================
  // GET ALL FOLDERS
  // ============================================================

  async getFolders(
    projectId: string,
    userId: string
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    return projectFolderRepository.findAll(
      projectId
    );
  }


  // ============================================================
  // GET FOLDER BY ID
  // ============================================================

  async getFolderById(
    projectId: string,
    folderId: string,
    userId: string
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

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


  // ============================================================
  // UPDATE FOLDER
  // ============================================================

  async updateFolder(
    projectId: string,
    folderId: string,
    userId: string,
    data: UpdateProjectFolderDto
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

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

    // Prevent duplicate folder names
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


  // ============================================================
  // DELETE FOLDER
  // ============================================================

  async deleteFolder(
    projectId: string,
    folderId: string,
    userId: string
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

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