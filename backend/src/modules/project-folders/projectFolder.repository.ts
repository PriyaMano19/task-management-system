import prisma from "../../database/prisma";
import {
  CreateProjectFolderDto,
  UpdateProjectFolderDto,
} from "./projectFolder.types";

class ProjectFolderRepository {
  async create(
    projectId: string,
    createdById: string,
    data: CreateProjectFolderDto
  ) {
    return prisma.projectFolder.create({
      data: {
        projectId,
        createdById,
        name: data.name,
        description: data.description,
      },

      include: {
        project: {
          select: {
            id: true,
            companyName: true,
            projectName: true,
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
      },
    });
  }

  async findAll(projectId: string) {
    return prisma.projectFolder.findMany({
      where: {
        projectId,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        _count: {
          select: {
            tasks: true,
          },
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async findById(
    projectId: string,
    folderId: string
  ) {
    return prisma.projectFolder.findFirst({
      where: {
        id: folderId,
        projectId,
      },

      include: {
        project: {
          select: {
            id: true,
            companyName: true,
            projectName: true,
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

        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async findByName(
    projectId: string,
    name: string
  ) {
    return prisma.projectFolder.findFirst({
      where: {
        projectId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },

    });
  }
  
  async update(
    folderId: string,
    data: UpdateProjectFolderDto
  ) {
    return prisma.projectFolder.update({
      where: {
        id: folderId,
      },

      data,
    });
  }

  async delete(folderId: string) {
    return prisma.projectFolder.delete({
      where: {
        id: folderId,
      },
    });
  }
}

export const projectFolderRepository =
  new ProjectFolderRepository();