import prisma from "../../database/prisma";

class TaskAttachmentRepository {
  async findByTask(
    taskId: string
  ) {
    return prisma.taskAttachment.findMany({
      where: {
        taskId,
      },

      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findById(
    taskId: string,
    attachmentId: string
  ) {
    return prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        taskId,
      },

      include: {
        uploadedBy: {
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

  async delete(
    attachmentId: string
  ) {
    return prisma.taskAttachment.delete({
      where: {
        id: attachmentId,
      },
    });
  }
}

export const taskAttachmentRepository =
  new TaskAttachmentRepository();