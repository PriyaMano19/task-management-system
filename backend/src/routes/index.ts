import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Task Management API v1",
  });
});

router.use("/auth", authRoutes);

export default router;