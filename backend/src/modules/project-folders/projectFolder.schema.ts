import { z } from "zod";

export const createProjectFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Folder name must be at least 2 characters")
    .max(150, "Folder name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .optional(),
});

export const updateProjectFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Folder name must be at least 2 characters")
    .max(150, "Folder name must not exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .optional(),
});