import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  saveRefreshToken,
  updateLastLogin,
  findRefreshToken,
  deleteRefreshToken,
  updatePassword,
  deleteUserRefreshTokens,
} from "./auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils";

export const login = async (
  email: string,
  password: string
) => {
  const user = await findUserByEmail(email);

if (!user) {
  throw new Error("Email address not found.");
}

const passwordMatched = await bcrypt.compare(
  password,
  user.password
);

if (!passwordMatched) {
  throw new Error("Incorrect password.");
}

  const payload = {
    userId: user.id,
    roleId: user.roleId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await saveRefreshToken(
    user.id,
    refreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  await updateLastLogin(user.id);

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
    },
    accessToken,
    refreshToken,
  };
};
export const refreshAccessToken = async (
  refreshToken: string
) => {
  const storedToken = await findRefreshToken(refreshToken);

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  ) as {
    userId: string;
    roleId: string;
  };

  if (decoded.userId !== storedToken.user.id) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token has expired");
  }

  const payload = {
    userId: storedToken.user.id,
    roleId: storedToken.user.roleId,
  };

  const accessToken = generateAccessToken(payload);

  return {
    accessToken,
  };
};
export const logout = async (refreshToken: string) => {
  const storedToken = await findRefreshToken(refreshToken);

  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  await deleteRefreshToken(refreshToken);

  return {
    message: "Logged out successfully",
  };
};
export const resetPassword = async (
  userId: string,
  newPassword: string
) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await updatePassword(userId, hashedPassword);

  await deleteUserRefreshTokens(userId);

  return {
    success: true,
    message: "Password updated successfully. Please login again.",
  };
};