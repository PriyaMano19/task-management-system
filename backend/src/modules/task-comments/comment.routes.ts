import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from "./comment.controller";

import {
  createCommentSchema,
  updateCommentSchema,
} from "./comment.schema";

const router = Router();

router.post(
  "/:projectId/folders/:folderId/tasks/:taskId/comments",
  authenticate,
  validate(createCommentSchema),
  createComment
);

router.get(
  "/:projectId/folders/:folderId/tasks/:taskId/comments",
  authenticate,
  getComments
);

router.put(
  "/:projectId/folders/:folderId/tasks/:taskId/comments/:commentId",
  authenticate,
  validate(updateCommentSchema),
  updateComment
);

router.delete(
  "/:projectId/folders/:folderId/tasks/:taskId/comments/:commentId",
  authenticate,
  deleteComment
);

export default router;