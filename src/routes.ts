import { Router } from "express"
import userRoutes from "./modules/user/user.routes"

const router = Router()

router.use("/users", userRoutes)

router.get("/health", (_req, res) => {
    return res.status(200).send("OK")
})

export default router
