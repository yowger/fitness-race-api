import { Router } from "express"
import * as raceEventsController from "./raceEvents.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = Router()

router.get("/race/:raceId", asyncHandler(raceEventsController.listRaceEvents))

router.get("/:id", asyncHandler(raceEventsController.getRaceEventById))

router.post(
    "/",
    authMiddleware,
    asyncHandler(raceEventsController.createRaceEvent)
)

router.delete(
    "/:id",
    authMiddleware,
    asyncHandler(raceEventsController.deleteRaceEvent)
)

export default router
