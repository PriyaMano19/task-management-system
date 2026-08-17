import prisma from "../../database/prisma";
import {
  CreateCommentDto,
  UpdateCommentDto,
} from "./comment.types";

class CommentRepository {
  async create(
    taskId: string,
    userId: string,
    data: CreateCommentDto
  ) {
    return prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: data.content,
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

  async findAll(taskId: string) {
    return prisma.taskComment.findMany({
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
        createdAt: "asc",
      },
    });
  }

  async findById(
    taskId: string,
    commentId: string
  ) {
    return prisma.taskComment.findFirst({
      where: {
        id: commentId,
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
    });
  }

  async update(
    commentId: string,
    data: UpdateCommentDto
  ) {
    return prisma.taskComment.update({
      where: {
        id: commentId,
      },

      data: {
        content: data.content,
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

  async delete(commentId: string) {
    return prisma.taskComment.delete({
      where: {
        id: commentId,
      },
    });
  }
}

export const commentRepository =
  new CommentRepository();