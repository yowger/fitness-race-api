import { Router } from "express"

import * as routeController from "./routes.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = Router()

router.get("/", authMiddleware, asyncHandler(routeController.listRoutes))
router.get("/:id", authMiddleware, asyncHandler(routeController.getRouteById))
router.post("/", authMiddleware, asyncHandler(routeController.createRoute))
router.delete("/:id", authMiddleware, asyncHandler(routeController.deleteRoute))

export default router
