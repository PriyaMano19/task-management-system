import { Request, Response, NextFunction } from "express";
import { taskService } from "./task.service";
import { getParam } from "../../shared/utils/getParam";
import { taskAttachmentService } from "./taskAttachment.service";


export const createTask = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const files =
      (req.files as Express.Multer.File[]) || [];

    const task =
      await taskService.createTask(
        projectId,
        folderId,
        req.user.id,
        req.body,
        files
      );

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });

  } catch (error) {
    next(error);
  }
};
export const uploadTaskAttachment = async (
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

    const projectId = getParam(req.params.projectId);
    const folderId = getParam(req.params.folderId);
    const taskId = getParam(req.params.taskId);

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Attachment file is required.",
      });
    }

    const attachment =
      await taskAttachmentService.uploadAttachment(
        projectId,
        folderId,
        taskId,
        file,
        req.user.id
      );

    return res.status(201).json({
      success: true,
      message: "Task attachment uploaded successfully.",
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};


export const getTasks = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const result =
      await taskService.getTasks(
        projectId,
        folderId,
        req.user.id,
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully.",
      ...result,
    });

  } catch (error) {
    next(error);
  }
};



export const getTaskById = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const task =
      await taskService.getTaskById(
        projectId,
        folderId,
        taskId,
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully.",
      data: task,
    });

  } catch (error) {
    next(error);
  }
};


export const updateTask = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const task =
      await taskService.updateTask(
        projectId,
        folderId,
        taskId,
        req.user.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: task,
    });

  } catch (error) {
    next(error);
  }
};



export const deleteTask = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    await taskService.deleteTask(
      projectId,
      folderId,
      taskId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};


export const getTaskAttachments = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

   const attachments =
  await taskAttachmentService.getAttachments(
    projectId,
    folderId,
    taskId,
    req.user.id
  );

    return res.status(200).json({
      success: true,
      message:
        "Task attachments retrieved successfully.",
      data: attachments,
    });

  } catch (error) {
    next(error);
  }
};



export const downloadTaskAttachment = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const attachmentId =
      getParam(req.params.attachmentId);

   const attachment =
  await taskAttachmentService.getAttachment(
    projectId,
    folderId,
    taskId,
    attachmentId,
    req.user.id
  );

    return res.download(
      attachment.filePath,
      attachment.originalName
    );

  } catch (error) {
    next(error);
  }
};



export const deleteTaskAttachment = async (
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

    const projectId =
      getParam(req.params.projectId);

    const folderId =
      getParam(req.params.folderId);

    const taskId =
      getParam(req.params.taskId);

    const attachmentId =
      getParam(req.params.attachmentId);

    await taskAttachmentService.deleteAttachment(
      projectId,
      folderId,
      taskId,
      attachmentId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Task attachment deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};