import { Router } from "express"
import * as raceController from "./race.controller"

const router = Router()

router.get("/", raceController.listRaces)
router.get("/:id", raceController.getRaceById)
router.post("/", raceController.createRace)
router.delete("/:id", raceController.deleteRace)

export default router
