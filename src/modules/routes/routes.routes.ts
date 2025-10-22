import { Router } from "express"
import * as routeController from "./routes.controller"

const router = Router()

router.get("/", routeController.listRoutes)
router.get("/:id", routeController.getRouteById)
router.post("/", routeController.createRoute)
router.delete("/:id", routeController.deleteRoute)

export default router
