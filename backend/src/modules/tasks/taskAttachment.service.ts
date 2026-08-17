import fs from "fs/promises";

import { AppError } from "../../shared/errors/AppError";

import { projectFolderRepository } from "../project-folders/projectFolder.repository";
import { taskRepository } from "./task.repository";
import { taskAttachmentRepository } from "./taskAttachment.repository";
import { taskActivityRepository } from "../task-activities/taskActivity.repository";

class TaskAttachmentService {

  // ============================================================
  // GET ALL ATTACHMENTS
  // ============================================================

  async getAttachments(
    projectId: string,
    folderId: string,
    taskId: string
  ) {

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


  // ============================================================
  // GET SINGLE ATTACHMENT
  // ============================================================

  async getAttachment(
    projectId: string,
    folderId: string,
    taskId: string,
    attachmentId: string
  ) {

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


  // ============================================================
  // DELETE ATTACHMENT
  // ============================================================

  async deleteAttachment(
    projectId: string,
    folderId: string,
    taskId: string,
    attachmentId: string,
    userId: string
  ) {

    // Get attachment and validate
    const attachment =
      await this.getAttachment(
        projectId,
        folderId,
        taskId,
        attachmentId
      );


    // ==========================================================
    // 1. Delete physical file
    // ==========================================================

    try {

      await fs.unlink(
        attachment.filePath
      );

    } catch (error: any) {

      // File may already be deleted.
      // We still remove the database record.

      if (error.code !== "ENOENT") {
        throw error;
      }
    }


    // ==========================================================
    // 2. Create activity BEFORE deleting
    //    the database record
    // ==========================================================

    await taskActivityRepository.create({
      taskId,
      userId,
      action: "ATTACHMENT_DELETED",
      field: "attachment",
      oldValue: attachment.originalName,
    });


    // ==========================================================
    // 3. Delete database record
    // ==========================================================

    await taskAttachmentRepository.delete(
      attachment.id
    );
  }
}

export const taskAttachmentService =
  new TaskAttachmentService();