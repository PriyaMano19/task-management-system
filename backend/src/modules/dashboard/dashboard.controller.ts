import {
  Request,
  Response,
  NextFunction,
} from "express";

import { dashboardService } from "./dashboard.service";

export const getGlobalDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const dashboard =
      await dashboardService.getGlobalDashboard(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Global dashboard retrieved successfully.",
      data: dashboard,
    });

  } catch (error) {
    next(error);
  }
};