import { Router } from "express"

import { authMiddleware } from "../../middlewares/auth.middleware"
import * as userController from "./user.controller"
import { asyncHandler } from "../../utils/asyncHandler"

const router = Router()

router.post("/", asyncHandler(userController.createUser))
router.get("/me", authMiddleware, asyncHandler(userController.getProfile))
router.get("/:id", asyncHandler(userController.getProfileById))
router.get("/", authMiddleware, asyncHandler(userController.listUsers))

export default router
