import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile", isAuthenticated, getUserProfile);
router.put("/profile", isAuthenticated, updateUserProfile);

export default router;

