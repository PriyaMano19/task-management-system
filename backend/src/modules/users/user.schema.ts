
import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required."),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required."),

  email: z
    .email("Please enter a valid email address.")
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),

  roleId: z
    .string()
    .min(1, "Role is required."),

  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .default("ACTIVE"),
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .optional(),

  email: z
    .email("Please enter a valid email address.")
    .trim()
    .optional(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .optional(),

  roleId: z
    .string()
    .min(1, "Role is required.")
    .optional(),

  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional(),
});