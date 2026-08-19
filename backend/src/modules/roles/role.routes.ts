import { Router } from "express";

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "./role.controller";

import {
  createRoleSchema,
  updateRoleSchema,
} from "./role.schema";

import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

const router = Router();


router.get(
  "/",
  authenticate,
  getRoles
);


router.get(
  "/:id",
  authenticate,
  getRoleById
);


router.post(
  "/",
  authenticate,
  validate(createRoleSchema),
  createRole
);


router.put(
  "/:id",
  authenticate,
  validate(updateRoleSchema),
  updateRole
);


router.delete(
  "/:id",
  authenticate,
  deleteRole
);

export default router;