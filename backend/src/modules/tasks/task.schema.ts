import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200),

  description: z
    .string()
    .trim()
    .optional(),

  priority: z
    .nativeEnum(TaskPriority)
    .optional(),

  assignedToId: z
    .string()
    .uuid("Invalid user ID")
    .optional(),

  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(Date.parse(value)),
      {
        message: "Invalid due date",
      }
    ),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),

  status: z
    .nativeEnum(TaskStatus)
    .optional(),

  priority: z
    .nativeEnum(TaskPriority)
    .optional(),

  assignedToId: z
    .string()
    .uuid("Invalid user ID")
    .optional(),

  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isNaN(Date.parse(value)),
      {
        message: "Invalid due date",
      }
    ),
});