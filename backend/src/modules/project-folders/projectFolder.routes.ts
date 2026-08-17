import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} from "./projectFolder.controller";

import {
  createProjectFolderSchema,
  updateProjectFolderSchema,
} from "./projectFolder.schema";

const router = Router();

router.post(
  "/:projectId/folders",
  authenticate,
  validate(createProjectFolderSchema),
  createFolder
);

router.get(
  "/:projectId/folders",
  authenticate,
  getFolders
);

router.get(
  "/:projectId/folders/:folderId",
  authenticate,
  getFolderById
);

router.put(
  "/:projectId/folders/:folderId",
  authenticate,
  validate(updateProjectFolderSchema),
  updateFolder
);

router.delete(
  "/:projectId/folders/:folderId",
  authenticate,
  deleteFolder
);

export default router;