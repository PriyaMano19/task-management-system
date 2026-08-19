import {
  Request,
  Response,
  NextFunction,
} from "express";

import { userService } from "./user.service";

import { getParam } from "../../shared/utils/getParam";


export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users =
      await userService.getUsers();

    return res.status(200).json({
      success: true,
      message:
        "Users retrieved successfully.",
      data: users,
    });

  } catch (error) {
    next(error);
  }
};


export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    const user =
      await userService.getUserById(
        id
      );

    return res.status(200).json({
      success: true,
      message:
        "User retrieved successfully.",
      data: user,
    });

  } catch (error) {
    next(error);
  }
};


export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user =
      await userService.createUser(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "User created successfully.",
      data: user,
    });

  } catch (error) {
    next(error);
  }
};


export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    const user =
      await userService.updateUser(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "User updated successfully.",
      data: user,
    });

  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id =
      getParam(req.params.id);

    await userService.deleteUser(id);

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully.",
    });

  } catch (error) {
    next(error);
  }
};