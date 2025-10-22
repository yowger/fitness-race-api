import { Router } from "express"

import * as controller from "./locations.controller"

const router = Router()

router.post("/", controller.addLocation)
router.get("/:participantId", controller.getParticipantLocations)
router.get("/:participantId/latest", controller.getLatestLocation)

export default router
