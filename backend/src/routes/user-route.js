import express from "express";
import * as userController from "../controllers/user-controller.js";
import authMiddleware from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/sendOtp", userController.sendOtp);
router.post("/reset-password", userController.resetPassword);
router.get("/logOut", userController.logOutUser);
router.get("/profile", userController.profileUser);
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json(req.user);
});

router.get("/", authMiddleware, userController.getAllUsers);


export default router;
