import { Request, Response } from "express";
import { login,logout,refreshAccessToken,resetPassword ,  updateProfile,
} from "./auth.service";

export const loginController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};
export const getCurrentUserController = async (
  req: Request,
  res: Response
) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      id: req.user!.id,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      email: req.user!.email,
      role: req.user!.role.name,
      status: req.user!.status,
      createdAt: req.user!.createdAt,
    },
  });
};
export const refreshTokenController = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } = req.body;

    const result = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const logoutController = async (
  req: Request,
  res: Response
) => {
  const { refreshToken } = req.body;

  const result = await logout(refreshToken);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
};
export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { newPassword } = req.body;

    const result = await resetPassword(
      req.user!.id,
      newPassword
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateProfileController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await updateProfile(req.user!.id, req.body);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};