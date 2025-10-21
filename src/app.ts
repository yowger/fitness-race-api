import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"

import { errorHandler } from "./middlewares/error.middleware"
import routes from "./routes"

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(morgan("dev"))
app.use("/api", routes)
app.get("/test", (_req, res) => {
    res.send("Fitness Run API is running!")
})
app.use(errorHandler)

export default app
