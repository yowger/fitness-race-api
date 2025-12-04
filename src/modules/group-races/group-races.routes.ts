import express from "express"

import * as raceController from "./group-races.controller"

const router = express.Router()

router.post("/", raceController.createRace)
router.get("/", raceController.listRaces)
router.get("/:id", raceController.getRaceById)

router.post("/participants", raceController.addParticipant)
router.get("/:raceId/participants", raceController.getParticipantsByRace)

router.post("/tracking", raceController.addTracking)
router.get("/:raceId/tracking", raceController.getTrackingByRace)
router.get("/:raceId/tracking/:userId/latest", raceController.getLatestTracking)

router.post("/results", raceController.addResult)
router.get("/:raceId/results", raceController.getResultsByRace)

export default router
