import {
  Request,
  Response,
  NextFunction,
} from "express";

import { getParam } from "../../shared/utils/getParam";
import { projectDashboardService } from "./projectDashboard.service";

export const getProjectDashboard = async (
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

    const projectId =
      getParam(req.params.projectId);

    const dashboard =
      await projectDashboardService.getDashboard(
        projectId,
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Project dashboard retrieved successfully.",
      data: dashboard,
    });

  } catch (error) {
    next(error);
  }
};