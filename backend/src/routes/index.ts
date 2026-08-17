import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import projectRoutes from "../modules/projects/project.routes";
import projectFolderRoutes from "../modules/project-folders/projectFolder.routes";
const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Task Management API v1",
  });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/projects", projectFolderRoutes);

export default router;