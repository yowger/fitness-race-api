import { Router } from "express"
import * as runController from "./run.controller"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = Router()

router.get("/", authMiddleware, runController.listRuns)

router.get("/:id", authMiddleware, runController.getRunById)

router.post("/", authMiddleware, runController.createRun)

router.delete("/:id", authMiddleware, runController.deleteRun)

export default router
