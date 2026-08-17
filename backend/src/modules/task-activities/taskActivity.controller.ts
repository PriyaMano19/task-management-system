import {
  Request,
  Response,
  NextFunction,
} from "express";

import { getParam } from "../../shared/utils/getParam";
import { taskActivityService } from "./taskActivity.service";

export const getTaskActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId =
      getParam(req.params.taskId);

    const activities =
      await taskActivityService.getTaskActivities(
        taskId
      );

    return res.status(200).json({
      success: true,
      message: "Task activities retrieved successfully.",
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};