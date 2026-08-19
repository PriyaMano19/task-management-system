import {
  Request,
  Response,
  NextFunction,
} from "express";

import { roleService } from "./role.service";

import { getParam } from "../../shared/utils/getParam";


export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles =
      await roleService.getRoles();

    return res.status(200).json({
      success: true,
      message:
        "Roles retrieved successfully.",
      data: roles,
    });

  } catch (error) {
    next(error);
  }
};


export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    const role =
      await roleService.getRoleById(
        id
      );

    return res.status(200).json({
      success: true,
      message:
        "Role retrieved successfully.",
      data: role,
    });

  } catch (error) {
    next(error);
  }
};


export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role =
      await roleService.createRole(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Role created successfully.",
      data: role,
    });

  } catch (error) {
    next(error);
  }
};


export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    const role =
      await roleService.updateRole(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Role updated successfully.",
      data: role,
    });

  } catch (error) {
    next(error);
  }
};


export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    await roleService.deleteRole(id);

    return res.status(200).json({
      success: true,
      message:
        "Role deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};