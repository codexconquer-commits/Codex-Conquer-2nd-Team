import express from "express";
import * as userController from "../controllers/user-controller.js";
import authMiddleware from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/logOut", userController.logOutUser);
router.get("/", authMiddleware, userController.getAllUsers);

export default router;
