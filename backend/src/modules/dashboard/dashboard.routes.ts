import { Router } from "express";

import {
  getGlobalDashboard,
  getMyDashboard,
} from "./dashboard.controller";

import { authenticate } from "../../middleware/auth.middleware";

const router = Router();



router.get(
  "/me",
  authenticate,
  getMyDashboard
);



router.get(
  "/",
  authenticate,
  getGlobalDashboard
);

export default router;