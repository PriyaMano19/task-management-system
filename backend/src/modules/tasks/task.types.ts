import { TaskPriority, TaskStatus } from "@prisma/client";

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  assignedToId?: string | null;
  dueDate?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string | null;
  dueDate?: string | null;
}

export interface GetTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  page?: number;
  limit?: number;
}