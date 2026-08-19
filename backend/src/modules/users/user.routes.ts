import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./user.controller";

import {
  createUserSchema,
  updateUserSchema,
} from "./user.schema";

const router = Router();


router.get(
  "/",
  authenticate,
  getUsers
);


router.get(
  "/:id",
  authenticate,
  getUserById
);


router.post(
  "/",
  authenticate,
  validate(createUserSchema),
  createUser
);


router.put(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  updateUser
);


router.delete(
  "/:id",
  authenticate,
  deleteUser
);

export default router;