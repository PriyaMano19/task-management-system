import { taskActivityRepository } from "./taskActivity.repository";
import { CreateTaskActivityDto } from "./taskActivity.types";

class TaskActivityService {
  async createActivity(
    data: CreateTaskActivityDto
  ) {
    return taskActivityRepository.create(data);
  }

  async getTaskActivities(taskId: string) {
    return taskActivityRepository.findByTask(
      taskId
    );
  }
}

export const taskActivityService =
  new TaskActivityService();