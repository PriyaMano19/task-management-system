import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  getGlobalDashboard,
} from "./dashboard.controller";

const router = Router();

router.get(
  "/",
  authenticate,
  getGlobalDashboard
);

export default router;