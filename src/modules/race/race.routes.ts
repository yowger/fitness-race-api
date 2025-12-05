import { Router } from "express"
import * as raceController from "./race.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { authMiddleware } from "../../middlewares/auth.middleware"

const router = Router()

router.get("/", asyncHandler(raceController.listRaces))
router.get("/:id", asyncHandler(raceController.getRaceById))
router.post("/", authMiddleware, asyncHandler(raceController.createRace))
router.delete("/:id", asyncHandler(raceController.deleteRace))

export default router
