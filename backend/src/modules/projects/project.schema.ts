import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

const projectSchema = z.object({
  companyName: z.string().trim().min(2).max(150),
  projectName: z.string().trim().min(2).max(150),
  description: z.string().trim().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const createProjectSchema = projectSchema.refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.endDate >= data.startDate;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export const updateProjectSchema = projectSchema
  .partial()
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );
export const addProjectMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().min(1, "Role is required"),
});