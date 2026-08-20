import { taskRepository } from "./task.repository";
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksQuery,
} from "./task.types";

import { taskActivityRepository } from "../task-activities/taskActivity.repository";
import { projectRepository } from "../projects/project.repository";
import { projectMemberRepository } from "../projects/projectMember.repository";
import { projectFolderRepository } from "../project-folders/projectFolder.repository";
import { projectAccessService } from "../projects/projectAccess.service";

import { AppError } from "../../shared/errors/AppError";

class TaskService {

 
  async createTask(
    projectId: string,
    folderId: string,
    createdById: string,
    data: CreateTaskDto,
    files: Express.Multer.File[]
  ) {

    // Check creator is a project member
    await projectAccessService.validateProjectMember(
      projectId,
      createdById
    );

    // Check project
    const project =
      await projectRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        "Project not found.",
        404
      );
    }

    // Check folder belongs to project
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

    // Check assigned user is a project member
    if (data.assignedToId) {

      const member =
        await projectMemberRepository.findMember(
          projectId,
          data.assignedToId
        );

      if (!member) {
        throw new AppError(
          "Assigned user is not a member of this project.",
          400
        );
      }
    }

    // Create task
    const task =
      await taskRepository.create(
        folderId,
        createdById,
        data
      );

    // Task created activity
    await taskActivityRepository.create({
      taskId: task.id,
      userId: createdById,
      action: "TASK_CREATED",
    });

    // Save attachments
    if (files && files.length > 0) {

      for (const file of files) {

        await taskRepository.createAttachment(
          task.id,
          createdById,
          {
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSize: file.size,
          }
        );

        // Attachment added activity
        await taskActivityRepository.create({
          taskId: task.id,
          userId: createdById,
          action: "ATTACHMENT_ADDED",
          field: "attachment",
          newValue: file.originalname,
        });
      }
    }

    // Return complete task
    return taskRepository.findById(
      folderId,
      task.id
    );
  }



  async getTasks(
    projectId: string,
    folderId: string,
    userId: string,
    query: GetTasksQuery
  ) {

    // User must be a project member
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Check folder belongs to project
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

    const page =
      Number(query.page) || 1;

    const limit =
      Number(query.limit) || 10;

    const [tasks, total] =
      await Promise.all([
        taskRepository.findAll(
          folderId,
          {
            ...query,
            page,
            limit,
          }
        ),

        taskRepository.count(
          folderId,
          query
        ),
      ]);

    return {
      data: tasks,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit),
      },
    };
  }



  async getTaskById(
    projectId: string,
    folderId: string,
    taskId: string,
    userId: string
  ) {

    // User must be a project member
    await projectAccessService.validateProjectMember(
      projectId,
      userId
    );

    // Check folder belongs to project
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

    // Check task belongs to folder
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


 
async updateTask(
  projectId: string,
  folderId: string,
  taskId: string,
  updatedById: string,
  data: UpdateTaskDto
) {
  
  const task =
    await this.getTaskById(
      projectId,
      folderId,
      taskId,
      updatedById
    );

  const isReporter =
    task.createdById === updatedById;

  const isAssignee =
    task.assignedToId === updatedById;

 
  if (!isReporter && !isAssignee) {
    throw new AppError(
      "You do not have permission to update this task.",
      403
    );
  }


  if (!isReporter && isAssignee) {

    const allowedFields =
      Object.keys(data);

    const invalidFields =
      allowedFields.filter(
        (field) => field !== "status"
      );

    if (invalidFields.length > 0) {
      throw new AppError(
        "The assignee can only change the task status.",
        403
      );
    }
  }


  if (
    isReporter &&
    data.assignedToId !== undefined &&
    data.assignedToId !== null
  ) {
    const member =
      await projectMemberRepository.findMember(
        projectId,
        data.assignedToId
      );

    if (!member) {
      throw new AppError(
        "Assigned user is not a member of this project.",
        400
      );
    }
  }

  /*
   * Calculate due-date activity values.
   */
  const oldDueDate =
    task.dueDate
      ? task.dueDate.toISOString()
      : null;

  const newDueDate =
    data.dueDate !== undefined
      ? data.dueDate
        ? new Date(data.dueDate).toISOString()
        : null
      : oldDueDate;

  /*
   * Update task.
   */
  const updatedTask =
    await taskRepository.update(
      task.id,
      data
    );

  /*
   * STATUS
   */
  if (
    data.status !== undefined &&
    data.status !== task.status
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "STATUS_CHANGED",
      field: "status",
      oldValue: task.status,
      newValue: data.status,
    });
  }

  /*
   * PRIORITY
   */
  if (
    data.priority !== undefined &&
    data.priority !== task.priority
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "PRIORITY_CHANGED",
      field: "priority",
      oldValue: task.priority,
      newValue: data.priority,
    });
  }

  /*
   * ASSIGNEE
   */
  if (
    data.assignedToId !== undefined &&
    data.assignedToId !== task.assignedToId
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "ASSIGNEE_CHANGED",
      field: "assignedToId",
      oldValue:
        task.assignedToId ?? "UNASSIGNED",
      newValue:
        data.assignedToId ?? "UNASSIGNED",
    });
  }

  /*
   * DUE DATE
   */
  if (
    data.dueDate !== undefined &&
    newDueDate !== oldDueDate
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "DUE_DATE_CHANGED",
      field: "dueDate",
      oldValue:
        oldDueDate ?? "NO_DUE_DATE",
      newValue:
        newDueDate ?? "NO_DUE_DATE",
    });
  }

  /*
   * TITLE
   */
  if (
    data.title !== undefined &&
    data.title !== task.title
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "TITLE_CHANGED",
      field: "title",
      oldValue: task.title,
      newValue: data.title,
    });
  }

 
  if (
    data.description !== undefined &&
    data.description !== task.description
  ) {
    await taskActivityRepository.create({
      taskId: task.id,
      userId: updatedById,
      action: "DESCRIPTION_CHANGED",
      field: "description",
      oldValue:
        task.description ?? "",
      newValue:
        data.description ?? "",
    });
  }

  return updatedTask;
}


  async deleteTask(
  projectId: string,
  folderId: string,
  taskId: string,
  userId: string
) {
  const task =
    await this.getTaskById(
      projectId,
      folderId,
      taskId,
      userId
    );

 
  if (task.createdById !== userId) {
    throw new AppError(
      "Only the task reporter can delete this task.",
      403
    );
  }

  await taskRepository.delete(task.id);
}
}

export const taskService =
  new TaskService();