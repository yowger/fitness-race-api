import { Router } from "express"

import { authMiddleware } from "../../middlewares/auth.middleware"
import * as userController from "./user.controller"

const router = Router()

router.get("/me", authMiddleware, userController.getProfile)
router.get("/", authMiddleware, userController.listUsers)

export default router
