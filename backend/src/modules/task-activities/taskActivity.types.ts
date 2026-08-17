export interface CreateTaskActivityDto {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}