import prisma from "../../database/prisma";
export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};
export const findUserByEmail = async (
  email: string,
  excludeUserId?: string
) => {
  return prisma.user.findFirst({
    where: {
      email,
      ...(excludeUserId && {
        NOT: {
          id: excludeUserId,
        },
      }),
    },
    include: {
      role: true,
    },
  });
};
export const saveRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

export const updateLastLogin = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      lastLogin: new Date(),
    },
  });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: {
      token,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const deleteRefreshToken = async (token: string) => {
  return prisma.refreshToken.delete({
    where: {
      token,
    },
  });
};
export const getUserPermissions = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return (
    user?.role.rolePermissions.map(
      (rp: { permission: { name: any; }; }) => rp.permission.name
    ) ?? []
  );
};
export const updatePassword = async (
  userId: string,
  password: string
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password,
    },
  });
};

export const deleteUserRefreshTokens = async (
  userId: string
) => {
  return prisma.refreshToken.deleteMany({
    where: {
      userId,
    },
  });
};
export const updateUserProfile = async (
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  }
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
     
    },
    include: {
      role: true,
    },
  });
};