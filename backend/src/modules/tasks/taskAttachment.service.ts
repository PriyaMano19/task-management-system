import fs from "fs/promises";

import { AppError } from "../../shared/errors/AppError";

import { projectFolderRepository } from "../project-folders/projectFolder.repository";
import { taskRepository } from "./task.repository";
import { taskAttachmentRepository } from "./taskAttachment.repository";
import { taskActivityRepository } from "../task-activities/taskActivity.repository";
import { projectAccessService } from "../projects/projectAccess.service";

class TaskAttachmentService {

  async getAttachments(
    projectId: string,
    folderId: string,
    taskId: string,
    userId: string
  ) {
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
        "Folder not found in this project.",
        404
      );
    }

    const task =
      await taskRepository.findById(
        folderId,
        taskId
      );

    if (!task) {
      throw new AppError(
        "Task not found.",
        404
      );
    }

    return taskAttachmentRepository.findByTask(
      taskId
    );
  }


  async uploadAttachment(
    projectId: string,
    folderId: string,
    taskId: string,
    file: Express.Multer.File,
    userId: string
  ) {
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
        "Folder not found in this project.",
        404
      );
    }

    const task =
      await taskRepository.findById(
        folderId,
        taskId
      );

    if (!task) {
      throw new AppError(
        "Task not found.",
        404
      );
    }
    const isReporter =
  task.createdById === userId;

const isAssignee =
  task.assignedToId === userId;

if (!isReporter && !isAssignee) {
  throw new AppError(
    "Only the task reporter or assignee can upload attachments.",
    403
  );
}

    const attachment =
      await taskRepository.createAttachment(
        taskId,
        userId,
        {
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          mimeType: file.mimetype,
          fileSize: file.size,
        }
      );

    await taskActivityRepository.create({
      taskId,
      userId,
      action: "ATTACHMENT_ADDED",
      field: "attachment",
      newValue: file.originalname,
    });

    return attachment;
  }


  async getAttachment(
    projectId: string,
    folderId: string,
    taskId: string,
    attachmentId: string,
    userId: string
  ) {
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
        "Folder not found in this project.",
        404
      );
    }

    const task =
      await taskRepository.findById(
        folderId,
        taskId
      );

    if (!task) {
      throw new AppError(
        "Task not found.",
        404
      );
    }

    const attachment =
      await taskAttachmentRepository.findById(
        taskId,
        attachmentId
      );

    if (!attachment) {
      throw new AppError(
        "Attachment not found.",
        404
      );
    }

    return attachment;
  }


async deleteAttachment(
  projectId: string,
  folderId: string,
  taskId: string,
  attachmentId: string,
  userId: string
) {
  const attachment =
    await this.getAttachment(
      projectId,
      folderId,
      taskId,
      attachmentId,
      userId
    );

  const task =
    await taskRepository.findById(
      folderId,
      taskId
    );

  if (!task) {
    throw new AppError(
      "Task not found.",
      404
    );
  }

  const isReporter =
    task.createdById === userId;

  const isAssignee =
    task.assignedToId === userId;

  if (!isReporter && !isAssignee) {
    throw new AppError(
      "Only the task reporter or assignee can delete attachments.",
      403
    );
  }

  try {
    await fs.unlink(
      attachment.filePath
    );
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  await taskActivityRepository.create({
    taskId,
    userId,
    action: "ATTACHMENT_DELETED",
    field: "attachment",
    oldValue: attachment.originalName,
  });

  await taskAttachmentRepository.delete(
    attachment.id
  );
}
}

export const taskAttachmentService =
  new TaskAttachmentService();