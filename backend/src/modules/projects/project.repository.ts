import prisma from "../../database/prisma";
import {
  CreateProjectDto,
  UpdateProjectDto,
  GetProjectsQuery,
} from "./project.types";

class ProjectRepository {
  async create(
    data: CreateProjectDto,
    createdById: string
  ) {
    return prisma.project.create({
      data: {
        ...data,
        createdById,
      },
     include: {
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  _count: {
    select: {
      members: true,
    },
  },
},
    });
  }

async findById(id: string) {
  return prisma.project.findUnique({
    where: {
      id,
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

      members: {
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
      },

      _count: {
        select: {
          members: true,
        },
      },
    },
  });
}

async findAll(query: GetProjectsQuery) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
  } = query;

  return prisma.project.findMany({
    where: {
      ...(search && {
        OR: [
          {
            companyName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            projectName: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(status && { status }),
    },

    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },

      _count: {
        select: {
          members: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    skip: (page - 1) * limit,

    take: limit,
  });
}

  async update(
    id: string,
    data: UpdateProjectDto
  ) {
    return prisma.project.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.project.delete({
      where: {
        id,
      },
    });
  }

  async findByCompanyAndProjectName(
  companyName: string,
  projectName: string
) {
  return prisma.project.findFirst({
    where: {
      companyName: {
        equals: companyName,
        mode: "insensitive",
      },
      projectName: {
        equals: projectName,
        mode: "insensitive",
      },
    },
  });
}
async count(query: GetProjectsQuery) {
  const { search, status } = query;

  return prisma.project.count({
    where: {
      ...(search && {
        OR: [
          {
            companyName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            projectName: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(status && { status }),
    },
  });
}
}

export const projectRepository =
  new ProjectRepository();