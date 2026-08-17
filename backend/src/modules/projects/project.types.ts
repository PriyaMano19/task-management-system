import { ProjectStatus } from "@prisma/client";

export interface CreateProjectDto {
  companyName: string;
  projectName: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectDto {
  companyName?: string;
  projectName?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface GetProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
}