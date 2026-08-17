import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskAttachments,
  downloadTaskAttachment,
  deleteTaskAttachment,
} from "./task.controller";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./task.schema";

const router = Router();

router.post(
  "/:projectId/folders/:folderId/tasks",
  authenticate,
  upload.array("attachments", 10),
  validate(createTaskSchema),
  createTask
);

router.get(
  "/:projectId/folders/:folderId/tasks",
  authenticate,
  getTasks
);

router.get(
  "/:projectId/folders/:folderId/tasks/:taskId",
  authenticate,
  getTaskById
);

router.put(
  "/:projectId/folders/:folderId/tasks/:taskId",
  authenticate,
  validate(updateTaskSchema),
  updateTask
);

router.delete(
  "/:projectId/folders/:folderId/tasks/:taskId",
  authenticate,
  deleteTask
);

router.get(
  "/:projectId/folders/:folderId/tasks/:taskId/attachments",
  authenticate,
  getTaskAttachments
);

router.get(
  "/:projectId/folders/:folderId/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  downloadTaskAttachment
);

router.delete(
  "/:projectId/folders/:folderId/tasks/:taskId/attachments/:attachmentId",
  authenticate,
  deleteTaskAttachment
);
export default router;