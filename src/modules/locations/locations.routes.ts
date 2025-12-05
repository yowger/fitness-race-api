import { Router } from "express"

import * as controller from "./locations.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = Router()

router.post("/", authMiddleware, asyncHandler(controller.addLocation))
router.get("/:participantId", asyncHandler(controller.getParticipantLocations))
router.get("/:participantId/latest", asyncHandler(controller.getLatestLocation))

export default router
