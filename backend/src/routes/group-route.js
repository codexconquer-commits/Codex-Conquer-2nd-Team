import express from "express";
import * as groupController from "../controllers/group-controller.js";
import authMiddleware from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/addPeople",authMiddleware,groupController.createGroupChat)
router.get("/myGroups", authMiddleware, groupController.getMyGroups);
router.get("/getAllUsers", authMiddleware, groupController.getAllUsers);
router.put("/removeUser", authMiddleware, groupController.removeUser);



export default router;

