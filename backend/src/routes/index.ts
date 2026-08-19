import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import projectRoutes from "../modules/projects/project.routes";
import projectFolderRoutes from "../modules/project-folders/projectFolder.routes";
import taskRoutes from "../modules/tasks/task.routes";
import commentRoutes from "../modules/task-comments/comment.routes";
import userRoutes from "../modules/users/user.routes";
import roleRoutes from "../modules/roles/role.routes";
import taskActivityRoutes
  from "../modules/task-activities/taskActivity.routes";
  import dashboardRoutes
  from "../modules/dashboard/dashboard.routes";
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
router.use("/projects", taskRoutes);
router.use("/projects", commentRoutes);
router.use(
  "/dashboard",
  dashboardRoutes
);
router.use(
  "/projects",
  taskActivityRoutes
);
router.use(
  "/users",
  userRoutes
);
router.use(
  "/roles",
  roleRoutes
);


export default router;