import prisma from "../../database/prisma";
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksQuery,
} from "./task.types";

class TaskRepository {
  async create(
    folderId: string,
    createdById: string,
    data: CreateTaskDto
  ) {
    return prisma.task.create({
      data: {
        folderId,
        createdById,

        title: data.title,
        description: data.description,

        priority: data.priority,
        assignedToId: data.assignedToId,

       dueDate: data.dueDate
        ? new Date(data.dueDate)
        : null,
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        attachments: true,
      },
    });
  }

  async findAll(
    folderId: string,
    query: GetTasksQuery
  ) {
    const {
      status,
      priority,
      assignedToId,
      page = 1,
      limit = 10,
    } = query;

    return prisma.task.findMany({
      where: {
        folderId,

        ...(status && {
          status,
        }),

        ...(priority && {
          priority,
        }),

        ...(assignedToId && {
          assignedToId,
        }),
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        attachments: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async count(
    folderId: string,
    query: GetTasksQuery
  ) {
    const {
      status,
      priority,
      assignedToId,
    } = query;

    return prisma.task.count({
      where: {
        folderId,

        ...(status && {
          status,
        }),

        ...(priority && {
          priority,
        }),

        ...(assignedToId && {
          assignedToId,
        }),
      },
    });
  }

  async findById(
    folderId: string,
    taskId: string
  ) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        folderId,
      },

      include: {
        folder: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },

        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

async update(
  taskId: string,
  data: UpdateTaskDto
) {
  return prisma.task.update({
    where: {
      id: taskId,
    },

    data: {
      ...data,

      dueDate:
        data.dueDate !== undefined
          ? data.dueDate
            ? new Date(data.dueDate)
            : null
          : undefined,
    },

    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },

      attachments: true,
    },
  });
}

  async delete(taskId: string) {
    return prisma.task.delete({
      where: {
        id: taskId,
      },
    });
  }

  async createAttachment(
    taskId: string,
    uploadedById: string,
    data: {
      originalName: string;
      fileName: string;
      filePath: string;
      mimeType: string;
      fileSize: number;
    }
  ) {
    return prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById,

        originalName: data.originalName,
        fileName: data.fileName,
        filePath: data.filePath,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
      },
    });
  }
}

export const taskRepository =
  new TaskRepository();