import express from "express"

import * as raceController from "./group-races.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = express.Router()

router.post("/", authMiddleware, asyncHandler(raceController.createRace))
router.get("/", asyncHandler(raceController.listRaces))
router.get("/:id", asyncHandler(raceController.getRaceById))

router.post("/participants", asyncHandler(raceController.addParticipant))
router.get(
    "/:raceId/participants",
    asyncHandler(raceController.getParticipantsByRace)
)

router.post("/tracking", asyncHandler(raceController.addTracking))
router.get("/:raceId/tracking", asyncHandler(raceController.getTrackingByRace))
router.get(
    "/:raceId/tracking/:userId/latest",
    asyncHandler(raceController.getLatestTracking)
)

router.post("/results", asyncHandler(raceController.addResult))
router.get("/:raceId/results", asyncHandler(raceController.getResultsByRace))

export default router
