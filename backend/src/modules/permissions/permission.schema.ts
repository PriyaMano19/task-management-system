import { z } from "zod";

export const updateRolePermissionsSchema = z.object({
  permissionIds: z
    .array(
      z.string().min(1, "Permission ID is required.")
    )
    .default([]),
});