import {
  Request,
  Response,
  NextFunction,
} from "express";

import { permissionService } from "./permission.service";
import { getParam } from "../../shared/utils/getParam";

export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissions =
      await permissionService.getPermissions();

    return res.status(200).json({
      success: true,
      message:
        "Permissions retrieved successfully.",
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleId =
      getParam(req.params.id);

    const permissions =
      await permissionService.getRolePermissions(
        roleId
      );

    return res.status(200).json({
      success: true,
      message:
        "Role permissions retrieved successfully.",
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleId =
      getParam(req.params.id);

    const permissions =
      await permissionService.updateRolePermissions(
        roleId,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Role permissions updated successfully.",
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
};