import prisma from "../../database/prisma";
import { CreateTaskActivityDto } from "./taskActivity.types";

class TaskActivityRepository {
  async create(data: CreateTaskActivityDto) {
    return prisma.taskActivity.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        action: data.action,
        field: data.field,
        oldValue: data.oldValue,
        newValue: data.newValue,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByTask(taskId: string) {
    return prisma.taskActivity.findMany({
      where: {
        taskId,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const taskActivityRepository =
  new TaskActivityRepository();