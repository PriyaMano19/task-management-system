import { AppError } from "../../shared/errors/AppError";

import { projectFolderRepository } from "../project-folders/projectFolder.repository";
import { taskRepository } from "../tasks/task.repository";
import { taskActivityRepository } from "../task-activities/taskActivity.repository";
import { projectAccessService } from "../projects/projectAccess.service";

import {
  CreateCommentDto,
  UpdateCommentDto,
} from "./comment.types";

import { commentRepository } from "./comment.repository";

class CommentService {


  private async validateTask(
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

    return task;
  }


  async createComment(
    projectId: string,
    folderId: string,
    taskId: string,
    userId: string,
    data: CreateCommentDto
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Validate folder + task
    await this.validateTask(
      projectId,
      folderId,
      taskId
    );

    // Create comment
    const comment =
      await commentRepository.create(
        taskId,
        userId,
        data
      );

    // Create activity
    await taskActivityRepository.create({
      taskId,
      userId,
      action: "COMMENT_ADDED",
    });

    return comment;
  }



  async getComments(
    projectId: string,
    folderId: string,
    taskId: string,
    userId: string
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Validate folder + task
    await this.validateTask(
      projectId,
      folderId,
      taskId
    );

    return commentRepository.findAll(
      taskId
    );
  }



  async updateComment(
    projectId: string,
    folderId: string,
    taskId: string,
    commentId: string,
    userId: string,
    data: UpdateCommentDto
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Validate folder + task
    await this.validateTask(
      projectId,
      folderId,
      taskId
    );

    const comment =
      await commentRepository.findById(
        taskId,
        commentId
      );

    if (!comment) {
      throw new AppError(
        "Comment not found.",
        404
      );
    }

    // Only the creator can edit
    // their own comment.
    if (comment.userId !== userId) {
      throw new AppError(
        "You can only edit your own comments.",
        403
      );
    }

    // Update comment
    const updatedComment =
      await commentRepository.update(
        commentId,
        data
      );

    // Create activity
    await taskActivityRepository.create({
      taskId,
      userId,
      action: "COMMENT_UPDATED",
      field: "content",
      oldValue: comment.content,
      newValue: data.content,
    });

    return updatedComment;
  }



  async deleteComment(
    projectId: string,
    folderId: string,
    taskId: string,
    commentId: string,
    userId: string
  ) {

    // User must be a member of the project
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Validate folder + task
    await this.validateTask(
      projectId,
      folderId,
      taskId
    );

    const comment =
      await commentRepository.findById(
        taskId,
        commentId
      );

    if (!comment) {
      throw new AppError(
        "Comment not found.",
        404
      );
    }

    // Only the creator can delete
    // their own comment.
    if (comment.userId !== userId) {
      throw new AppError(
        "You can only delete your own comments.",
        403
      );
    }

    // Create activity BEFORE deleting
    // because the comment itself will be removed.
    await taskActivityRepository.create({
      taskId,
      userId,
      action: "COMMENT_DELETED",
      field: "content",
      oldValue: comment.content,
    });

    // Delete comment
    await commentRepository.delete(
      commentId
    );
  }
}

export const commentService =
  new CommentService();