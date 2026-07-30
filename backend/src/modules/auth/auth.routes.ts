import { Router } from "express";
import {
  loginController,
  getCurrentUserController,
  refreshTokenController,
  logoutController,
  resetPasswordController,
  updateProfileController
} from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { loginSchema ,refreshTokenSchema,logoutSchema,resetPasswordSchema,updateProfileSchema} from "./auth.schema";
import { authorize } from "../../middleware/authorize.middleware";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  loginController
);

router.get(
  "/me",
  authenticate,
  getCurrentUserController
);
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  refreshTokenController
);
router.post(
  "/logout",
  validate(logoutSchema),
  logoutController
);
router.get(
  "/admin-test",
  authenticate,
  authorize("user:create"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Authorization works!",
    });
  }
);
router.put(
  "/reset-password",
  authenticate,
  validate(resetPasswordSchema),
  resetPasswordController
);
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  updateProfileController
);
export default router;