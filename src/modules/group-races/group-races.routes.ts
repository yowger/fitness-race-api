import express from "express"

import * as raceController from "./group-races.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = express.Router()

router.post("/", authMiddleware, asyncHandler(raceController.createRace))
router.get("/", asyncHandler(raceController.listRaces))
router.get("/:id", asyncHandler(raceController.getRaceById))

router.post("/participants", asyncHandler(raceController.addParticipant))
router.delete("/participants", asyncHandler(raceController.removeParticipant))
router.get(
    "/:raceId/participants",
    asyncHandler(raceController.getParticipantsByRace)
)
router.patch(
    "/participants/bib",
    authMiddleware,
    asyncHandler(raceController.updateParticipantBibController)
)

router.post("/tracking", asyncHandler(raceController.addTracking))
router.get("/:raceId/tracking", asyncHandler(raceController.getTrackingByRace))
router.get(
    "/:raceId/tracking/:userId/latest",
    asyncHandler(raceController.getLatestTracking)
)

router.post("/results", authMiddleware, asyncHandler(raceController.addResult))
router.get(
    "/results/paginated",
    asyncHandler(raceController.getResultsByRacePaginatedController)
)
router.post(
    "/results/publish",
    authMiddleware,
    asyncHandler(raceController.publishRaceResults)
)
router.get("/:raceId/results", asyncHandler(raceController.getResultsByRace))

router.post("/:raceId/start", authMiddleware, raceController.startRace)
router.post("/:raceId/end", authMiddleware, raceController.endRace)

router.get(
    "/runners/stats",
    asyncHandler(raceController.getRunnerProfileStatsController)
)

export default router
