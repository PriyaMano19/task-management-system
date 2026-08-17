import {
  Request,
  Response,
  NextFunction,
} from "express";

import { projectFolderService } from "./projectFolder.service";
import { getParam } from "../../shared/utils/getParam";

export const createFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projectId = getParam(
      req.params.projectId
    );

    const folder =
      await projectFolderService.createFolder(
        projectId,
        req.user.id,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Folder created successfully.",
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const getFolders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(
      req.params.projectId
    );

    const folders =
      await projectFolderService.getFolders(
        projectId
      );

    return res.status(200).json({
      success: true,
      message: "Project folders retrieved successfully.",
      data: folders,
    });
  } catch (error) {
    next(error);
  }
};

export const getFolderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(
      req.params.projectId
    );

    const folderId = getParam(
      req.params.folderId
    );

    const folder =
      await projectFolderService.getFolderById(
        projectId,
        folderId
      );

    return res.status(200).json({
      success: true,
      message: "Folder retrieved successfully.",
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(
      req.params.projectId
    );

    const folderId = getParam(
      req.params.folderId
    );

    const folder =
      await projectFolderService.updateFolder(
        projectId,
        folderId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Folder updated successfully.",
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFolder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(
      req.params.projectId
    );

    const folderId = getParam(
      req.params.folderId
    );

    await projectFolderService.deleteFolder(
      projectId,
      folderId
    );

    return res.status(200).json({
      success: true,
      message: "Folder deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};