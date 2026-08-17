import { TaskPriority, TaskStatus } from "@prisma/client";

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDate?: Date;
}

export interface GetTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  page?: number;
  limit?: number;
}