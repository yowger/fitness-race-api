import { Router } from "express"
import * as runController from "./run.controller"
import { authMiddleware } from "../../middlewares/auth.middleware"
import { asyncHandler } from "../../utils/asyncHandler"

const router = Router()

router.get("/", authMiddleware, asyncHandler(runController.listRuns))

router.get("/:id", authMiddleware, asyncHandler(runController.getRunById))

router.post("/", authMiddleware, asyncHandler(runController.createRun))

router.delete("/:id", authMiddleware, asyncHandler(runController.deleteRun))

export default router
