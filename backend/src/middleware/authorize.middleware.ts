import { NextFunction, Request, Response } from "express";
import { getUserPermissions } from "../modules/auth/auth.repository";

export const authorize =
  (permission: string) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const permissions = await getUserPermissions(req.user.id);

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };