export interface CreateProjectFolderDto {
  name: string;
  description?: string;
}

export interface UpdateProjectFolderDto {
  name?: string;
  description?: string;
}