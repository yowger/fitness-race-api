import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
// import routes from "./routes";
// import { errorHandler } from "./middlewares/error.middleware";

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(morgan("dev"))

// app.use("/api", routes);
// app.use(errorHandler)

export default app
