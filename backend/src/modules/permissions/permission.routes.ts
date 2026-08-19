import { Router } from "express";

import {
  getPermissions,
  getRolePermissions,
  updateRolePermissions,
} from "./permission.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import {
  updateRolePermissionsSchema,
} from "./permission.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  getPermissions
);

router.get(
  "/roles/:id",
  authenticate,
  getRolePermissions
);

router.put(
  "/roles/:id",
  authenticate,
  validate(updateRolePermissionsSchema),
  updateRolePermissions
);

export default router;