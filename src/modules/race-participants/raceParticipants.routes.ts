import { Router } from "express"
import * as controller from "./raceParticipants.controller"

const router = Router()

router.post("/join", controller.joinRace)
router.get("/:raceId", controller.listParticipants)
router.patch("/:participantId/progress", controller.updateProgress)
router.delete("/:raceId/leave", controller.leaveRace)

export default router
