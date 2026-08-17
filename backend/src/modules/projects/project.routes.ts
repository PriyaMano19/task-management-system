import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { createProject ,getProjects,deleteProject, getProjectById,updateProject,addProjectMember,
  getProjectMembers,
  removeProjectMember,} from "./project.controller";
import { createProjectSchema ,addProjectMemberSchema,updateProjectSchema} from "./project.schema";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createProjectSchema),
  createProject
);

router.get(
  "/",
  authenticate,
  getProjects
);
router.get(
  "/:id",
  authenticate,
  getProjectById
);
router.put(
  "/:id",
  authenticate,
  validate(updateProjectSchema),
  updateProject
);
router.delete(
  "/:id",
  authenticate,
  deleteProject
);
router.post(
  "/:id/members",
  authenticate,
  validate(addProjectMemberSchema),
  addProjectMember
);

router.get(
  "/:id/members",
  authenticate,
  getProjectMembers
);

router.delete(
  "/:id/members/:userId",
  authenticate,
  removeProjectMember
);
export default router;