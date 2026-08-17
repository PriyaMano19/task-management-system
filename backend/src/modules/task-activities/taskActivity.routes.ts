import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  getTaskActivities,
} from "./taskActivity.controller";

const router = Router();

router.get(
  "/:projectId/folders/:folderId/tasks/:taskId/activities",
  authenticate,
  getTaskActivities
);

export default router;