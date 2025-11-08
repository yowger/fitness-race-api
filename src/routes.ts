import { Router } from "express"

import authRoutes from "./modules/auth/auth.routes"
import userRoutes from "./modules/user/user.routes"
import routeRoutes from "./modules/routes/routes.routes"
import raceRoutes from "./modules/race/race.routes"
import locationRoutes from "./modules/locations/locations.routes"
import runRoutes from "./modules/runs/run.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/routes", routeRoutes)
router.use("/races", raceRoutes)
router.use("/locations", locationRoutes)
router.use("/runs", runRoutes)

router.get("/health", (_req, res) => {
    return res.status(200).send("OK")
})

export default router
