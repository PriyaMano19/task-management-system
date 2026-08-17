import { Request, Response, NextFunction } from "express";
import { projectService } from "./project.service";
import { getParam } from "../../shared/utils/getParam";
export const createProject = async (
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

    const project = await projectService.createProject(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await projectService.getProjects(req.query);

    return res.status(200).json({
      success: true,
      message: "Projects retrieved successfully.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
  
};
export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getParam(req.params.id);

    const project = await projectService.getProjectById(id);

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
  return next(error);
}
};
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const project = await projectService.updateProject(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await projectService.deleteProject(id);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
export const addProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(req.params.id);

    const { userId, roleId } = req.body;

    const member = await projectService.addMember(
      projectId,
      userId,
      roleId
    );

    return res.status(201).json({
      success: true,
      message: "Project member added successfully.",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(req.params.id);

    const members = await projectService.getProjectMembers(projectId);

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = getParam(req.params.id);
    const userId = getParam(req.params.userId);

    await projectService.removeMember(projectId, userId);

    return res.status(200).json({
      success: true,
      message: "Project member removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};