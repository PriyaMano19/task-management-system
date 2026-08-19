import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required."),

  description: z
    .string()
    .trim()
    .optional(),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .optional(),

  description: z
    .string()
    .trim()
    .nullable()
    .optional(),
});